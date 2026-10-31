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
    const rawBody = await readBody<unknown>(event)
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
        throw createError({ statusCode: 400, message: 'Request body 格式錯誤' })
    }
    const body = rawBody as Record<string, unknown>

    if (typeof body.account !== 'string' || typeof body.password !== 'string') {
        throw createError({ statusCode: 400, message: '帳號與密碼為必填' })
    }
    const account = body.account.trim()
    if (!account || account.length > 191 || body.password.length < 8 || body.password.length > 128) {
        throw createError({ statusCode: 400, message: '帳號不可超過 191 字元，密碼需為 8 至 128 字元' })
    }
    const email = body.email === undefined || body.email === null || body.email === ''
        ? null
        : typeof body.email === 'string' ? body.email.trim().toLowerCase() : null
    if (body.email !== undefined && body.email !== null && body.email !== '' && !email) {
        throw createError({ statusCode: 400, message: 'email 格式錯誤' })
    }
    if (email && (email.length > 191 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        throw createError({ statusCode: 400, message: 'email 格式錯誤' })
    }
    const name = body.name === undefined || body.name === null || body.name === ''
        ? null
        : typeof body.name === 'string' ? body.name.trim() : null
    if (name && name.length > 191) throw createError({ statusCode: 400, message: 'name 不可超過 191 字元' })

    // 檢查帳號或 email 是否已存在
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { account },
                ...(email ? [{ email }] : []),
            ],
        },
    })
    if (existingUser) {
        throw createError({
            statusCode: 409,
            message: '帳號或 email 已存在',
        })
    }
    // 密碼加密（使用 bcrypt）
    const passwordHash = await bcrypt.hash(body.password, 12)
    const newUser = await prisma.user.create({
        data: {
            account,
            email,
            password: passwordHash,
            name,
            role: 1, // 預設為管理者
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    }).catch((error: unknown) => {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            throw createError({ statusCode: 409, message: '帳號或 email 已存在' })
        }
        throw error
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
