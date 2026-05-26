import type { H3Event } from 'h3'
import { verifyToken, type JwtPayload } from './jwt'

// 驗證 JWT Cookie，回傳 payload；驗證失敗則拋出 401
export function requireAuth(event: H3Event): JwtPayload {
    const token = getCookie(event, 'auth_token')

    if (!token) {
        throw createError({
            statusCode: 401,
            statusMessage: '請先登入',
        })
    }

    const config = useRuntimeConfig(event)

    try {
        return verifyToken(token, config.jwtSecret)
    }
    catch {
        throw createError({
            statusCode: 401,
            statusMessage: '登入已過期，請重新登入',
        })
    }
}
