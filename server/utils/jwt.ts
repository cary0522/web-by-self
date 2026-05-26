import jwt from 'jsonwebtoken'

export interface JwtPayload {
    id: number
    account: string
    role: number
}
// 產生 JWT，預設有效期為 7 天
export function signToken(payload: JwtPayload, secret: string): string {
    return jwt.sign(payload, secret, { expiresIn: '7d' })
}
// 驗證 JWT，成功回傳解碼後的 payload，失敗會丟出錯誤
export function verifyToken(token: string, secret: string): JwtPayload {
    return jwt.verify(token, secret) as JwtPayload
}
