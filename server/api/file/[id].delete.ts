import { requireAdmin } from '../../utils/auth'
import { requireSiteOwnerById } from '../../utils/ownership'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: 'file id 格式錯誤' })
    const file = await prisma.file.findUnique({
        where: { id, deletedAt: null },
        include: { _count: { select: { pages: true, usages: true } } },
    })
    if (!file) throw createError({ statusCode: 404, message: '找不到檔案' })
    await requireSiteOwnerById(authUser.id, file.siteId)
    if (file._count.pages > 0 || file._count.usages > 0) {
        throw createError({ statusCode: 409, message: '檔案仍被頁面或區塊引用，無法刪除' })
    }
    return prisma.file.update({
        where: { id },
        data: { deletedAt: new Date(), deletedBy: authUser.id, isPublic: false },
    })
})
