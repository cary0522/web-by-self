import { requireAdmin } from '../../../utils/auth'
import { requireSiteOwnerById } from '../../../utils/ownership'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: '公告 ID 格式錯誤' })
    const announcement = await prisma.announcement.findUnique({ where: { id, deletedAt: null } })
    if (!announcement) throw createError({ statusCode: 404, message: '找不到公告' })
    await requireSiteOwnerById(authUser.id, announcement.siteId)
    return prisma.announcement.update({
        where: { id },
        data: { isEnabled: false, deletedAt: new Date(), deletedBy: authUser.id, updatedBy: authUser.id },
    })
})
