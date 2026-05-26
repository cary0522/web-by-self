// /api/auth/login 登入
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body.account || !body.password) {
        throw createError({
            statusCode: 400,
            statusMessage: '帳號與密碼為必填',
        })
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
        throw createError({
            statusCode: 401,
            statusMessage: '帳號或密碼錯誤',
        })
    }

    // 檢查密碼（使用 bcrypt 比對加密後的密碼）
    const isPasswordValid = await bcrypt.compare(body.password, user.password)
    if (!isPasswordValid) {
        throw createError({
            statusCode: 401,
            statusMessage: '帳號或密碼錯誤',
        })
    }

    // 產生 JWT 並寫入 HTTP-only Cookie
    const config = useRuntimeConfig(event)
    const token = signToken(
        { id: user.id, account: user.account, role: user.role },
        config.jwtSecret,
    )

    setCookie(event, 'auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 天
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