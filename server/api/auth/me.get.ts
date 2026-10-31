import { getOptionalAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

defineRouteMeta({
    openAPI: {
        tags: ['auth'],
        summary: '取得目前登入狀態',
        description: '依 Cookie 中的 JWT 驗證並回傳目前登入使用者資訊，未登入則回傳 null（不丟出 401）',
    },
})

// /api/auth/me GET 提供給前端路由守衛（middleware）使用，判斷目前是否已登入
export default defineEventHandler(async (event) => {
    const authUser = await getOptionalAuth(event)
    if (!authUser) return null

    const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: {
            id: true,
            account: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
        },
    })

    if (!user || !user.isActive) return null

    return user
})
