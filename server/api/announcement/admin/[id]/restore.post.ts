import { requireAdmin } from '../../../../utils/auth'
import { requireSiteOwnerById } from '../../../../utils/ownership'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: '公告 ID 格式錯誤' })

    const announcement = await prisma.announcement.findUnique({ where: { id } })
    if (!announcement || !announcement.deletedAt) throw createError({ statusCode: 404, message: '找不到已刪除的公告' })
    await requireSiteOwnerById(authUser.id, announcement.siteId)

    // Keep it disabled so restoring a record never republishes it unexpectedly.
    return prisma.announcement.update({
        where: { id },
        data: { deletedAt: null, deletedBy: null, isEnabled: false, updatedBy: authUser.id },
    })
})
