import { prisma } from '../../utils/prisma'
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body.account || !body.password) {
        return {
            success: false,
            message: 'Username and password are required'
        }
    }

    // 查詢管理者（支援帳號或 email 登入）
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

    // 檢查密碼（TODO: 實作密碼加密後需要用 bcrypt 比對）
    if (user.password !== body.password) {
        throw createError({
            statusCode: 401,
            statusMessage: '帳號或密碼錯誤',
        })
    }

    // 回傳使用者資料（不含密碼）
    return {
        id: user.id,
        account: user.account,
        email: user.email,
        name: user.name,
        role: user.role,
    }

})