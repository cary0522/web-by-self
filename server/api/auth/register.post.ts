import { prisma } from '../../utils/prisma'
import bcrypt from 'bcrypt'

defineRouteMeta({
    openAPI: {
        tags: ['auth'],
        summary: '使用者註冊',
        description: '使用者註冊',
    },
})

// /api/auth/register 註冊
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body.account || !body.password) {
        return {
            success: false,
            message: 'Username and password are required'
        }
    }

    // 檢查帳號或 email 是否已存在
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { account: body.account },
                { email: body.email },
            ],
        },
    })
    if (existingUser) {
        throw createError({
            statusCode: 409,
            statusMessage: '帳號或 email 已存在',
        })
    }
    // 密碼加密（使用 bcrypt）
    const passwordHash = await bcrypt.hash(body.password, 12)
    const newUser = await prisma.user.create({
        data: {
            account: body.account,
            email: body.email,
            password: passwordHash,
            name: body.name,
            role: 1, // 預設為管理者
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    })

    // 回傳使用者資料（不含密碼）
    return {
        id: newUser.id,
        account: newUser.account,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
    }

})