import bcrypt from 'bcrypt'
import { getRequestIP } from 'h3'
import {
    clearLoginAccountAttempts,
    consumeLoginAttempt,
    getLoginRateLimit,
    type LoginRateLimit,
} from '../../utils/login-rate-limit'
import { assertJwtSecret, AUTH_TOKEN_MAX_AGE_SECONDS } from '../../utils/jwt'

const MAX_ACCOUNT_LENGTH = 191
const MAX_PASSWORD_LENGTH = 128

interface LoginBody {
    account: string
    password: string
}

function parseLoginBody(body: unknown): LoginBody {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw createError({
            statusCode: 400,
            message: '請提供有效的帳號與密碼',
        })
    }

    const { account, password } = body as Record<string, unknown>
    if (typeof account !== 'string' || typeof password !== 'string') {
        throw createError({
            statusCode: 400,
            message: '帳號與密碼必須是字串',
        })
    }

    const normalizedAccount = account.trim()
    if (normalizedAccount.length === 0 || password.length === 0) {
        throw createError({
            statusCode: 400,
            message: '帳號與密碼為必填',
        })
    }

    if (normalizedAccount.length > MAX_ACCOUNT_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
        throw createError({
            statusCode: 400,
            message: `帳號不得超過 ${MAX_ACCOUNT_LENGTH} 字元，密碼不得超過 ${MAX_PASSWORD_LENGTH} 字元`,
        })
    }

    return {
        account: normalizedAccount,
        password,
    }
}

function throwRateLimitError(event: Parameters<typeof setResponseHeader>[0], limit: LoginRateLimit): never {
    setResponseHeader(event, 'Retry-After', limit.retryAfterSeconds)
    throw createError({
        statusCode: 429,
        message: '登入嘗試次數過多，請稍後再試',
    })
}

defineRouteMeta({
    openAPI: {
        tags: ['auth'],
        summary: '使用者登入',
        description: '使用者登入',
    },
})

// /api/auth/login 登入
export default defineEventHandler(async (event) => {
    const body = parseLoginBody(await readBody(event))
    const config = useRuntimeConfig(event)

    try {
        assertJwtSecret(config.jwtSecret)
    }
    catch {
        throw createError({
            statusCode: 500,
            message: '伺服器驗證設定錯誤',
        })
    }

    const rateLimitAccount = body.account.toLocaleLowerCase('en-US')
    // 預設只信任 socket 位址，避免攻擊者偽造 X-Forwarded-For 繞過限制。
    const clientIp = getRequestIP(event) || 'unknown'
    const existingLimit = consumeLoginAttempt(rateLimitAccount, clientIp)
    if (existingLimit) {
        throwRateLimitError(event, existingLimit)
    }

    // 查詢使用者（支援帳號或 email 登入）
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { account: body.account },
                { email: body.account },
            ],
        },
    })

    if (!user) {
        const limit = getLoginRateLimit(rateLimitAccount, clientIp)
        if (limit) {
            throwRateLimitError(event, limit)
        }

        throw createError({
            statusCode: 401,
            message: '帳號或密碼錯誤',
        })
    }

    // 檢查密碼（使用 bcrypt 比對加密後的密碼）
    const isPasswordValid = await bcrypt.compare(body.password, user.password)
    if (!isPasswordValid) {
        const limit = getLoginRateLimit(rateLimitAccount, clientIp)
        if (limit) {
            throwRateLimitError(event, limit)
        }

        throw createError({
            statusCode: 401,
            message: '帳號或密碼錯誤',
        })
    }

    if (!user.isActive) {
        throw createError({
            statusCode: 403,
            message: '帳號已停權',
        })
    }

    clearLoginAccountAttempts(rateLimitAccount)

    // 產生 JWT 並寫入 HTTP-only Cookie
    const token = signToken(
        { id: user.id, account: user.account, role: user.role },
        config.jwtSecret,
    )

    setCookie(event, 'auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: AUTH_TOKEN_MAX_AGE_SECONDS,
        path: '/',
    })

    // 回傳使用者資料（不含密碼與 token）
    return {
        id: user.id,
        account: user.account,
        email: user.email,
        name: user.name,
        role: user.role,
    }
})
