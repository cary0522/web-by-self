import type { H3Event } from 'h3'
import { prisma } from './prisma'
import { isJwtAuthenticationError, verifyToken, type JwtPayload } from './jwt'

export const ADMIN_ROLE = 1

interface AuthOptions {
    allowedRoles?: readonly number[]
}

// 驗證 JWT 後重新查詢 User，不信任 token 內可能過時的帳號與角色。
export async function requireAuth(event: H3Event, options: AuthOptions = {}): Promise<JwtPayload> {
    const token = getCookie(event, 'auth_token')

    if (!token) {
        throw createError({
            statusCode: 401,
            message: '請先登入',
        })
    }

    const config = useRuntimeConfig(event)
    let tokenPayload: JwtPayload

    try {
        tokenPayload = verifyToken(token, config.jwtSecret)
    }
    catch (error) {
        if (isJwtAuthenticationError(error)) {
            throw createError({
                statusCode: 401,
                message: '登入已過期，請重新登入',
            })
        }

        // 設定錯誤或其他伺服器異常不應偽裝成使用者的 401。
        throw error
    }

    const user = await prisma.user.findUnique({
        where: { id: tokenPayload.id },
        select: {
            id: true,
            account: true,
            role: true,
            isActive: true,
        },
    })

    if (!user) {
        throw createError({
            statusCode: 401,
            message: '登入已失效，請重新登入',
        })
    }

    if (!user.isActive) {
        throw createError({
            statusCode: 403,
            message: '帳號已停權',
        })
    }

    if (options.allowedRoles && !options.allowedRoles.includes(user.role)) {
        throw createError({
            statusCode: 403,
            message: '權限不足',
        })
    }

    return {
        id: user.id,
        account: user.account,
        role: user.role,
    }
}

export function requireAdmin(event: H3Event): Promise<JwtPayload> {
    return requireAuth(event, { allowedRoles: [ADMIN_ROLE] })
}

export async function getOptionalAuth(event: H3Event): Promise<JwtPayload | null> {
    if (!getCookie(event, 'auth_token')) return null
    try {
        return await requireAuth(event)
    } catch (error) {
        const statusCode = error && typeof error === 'object' && 'statusCode' in error
            ? Number(error.statusCode)
            : 500
        if (statusCode === 401) return null
        throw error
    }
}
