import jwt from 'jsonwebtoken'

export interface JwtPayload {
    id: number
    account: string
    role: number
}

export const JWT_ALGORITHM = 'HS256' as const
export const JWT_ISSUER = 'web-by-self'
export const JWT_AUDIENCE = 'web-by-self-admin'
export const AUTH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export class JwtConfigurationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'JwtConfigurationError'
    }
}

export function assertJwtSecret(secret: string): void {
    if (typeof secret !== 'string' || secret.trim().length === 0) {
        throw new JwtConfigurationError('JWT secret is not configured')
    }
}

function isJwtPayload(payload: string | jwt.JwtPayload): payload is jwt.JwtPayload & JwtPayload {
    return typeof payload !== 'string'
        && Number.isInteger(payload.id)
        && payload.id > 0
        && typeof payload.account === 'string'
        && payload.account.trim().length > 0
        && Number.isInteger(payload.role)
}

// 產生 JWT，token 與 Cookie 共用同一個有效期常數
export function signToken(payload: JwtPayload, secret: string): string {
    assertJwtSecret(secret)

    if (!isJwtPayload(payload)) {
        throw new TypeError('Invalid JWT payload')
    }

    return jwt.sign(payload, secret, {
        algorithm: JWT_ALGORITHM,
        expiresIn: AUTH_TOKEN_MAX_AGE_SECONDS,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    })
}

// 驗證 JWT，成功回傳解碼後的 payload，失敗會丟出錯誤
export function verifyToken(token: string, secret: string): JwtPayload {
    assertJwtSecret(secret)

    const payload = jwt.verify(token, secret, {
        algorithms: [JWT_ALGORITHM],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    })

    if (!isJwtPayload(payload)) {
        throw new jwt.JsonWebTokenError('Invalid token payload')
    }

    return {
        id: payload.id,
        account: payload.account,
        role: payload.role,
    }
}

export function isJwtAuthenticationError(error: unknown): boolean {
    return error instanceof jwt.JsonWebTokenError
        || error instanceof jwt.TokenExpiredError
        || error instanceof jwt.NotBeforeError
}
