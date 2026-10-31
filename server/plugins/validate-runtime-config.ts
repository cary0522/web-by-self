import { assertJwtSecret } from '../utils/jwt'

// 在伺服器啟動時即拒絕缺少 JWT secret 的錯誤設定，避免登入後才發現。
export default defineNitroPlugin(() => {
    const config = useRuntimeConfig()
    assertJwtSecret(config.jwtSecret)
})
