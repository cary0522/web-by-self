import { requireAdmin } from '../../../utils/auth'
import { requireSiteOwnerById } from '../../../utils/ownership'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const siteId = Number(getRouterParam(event, 'siteId'))
    if (!Number.isInteger(siteId) || siteId <= 0) throw createError({ statusCode: 400, message: 'site ID 格式錯誤' })
    await requireSiteOwnerById(authUser.id, siteId)
    return prisma.siteMenu.findMany({
        where: { siteId, isDeleted: true },
        orderBy: [{ deletedAt: 'desc' }, { id: 'desc' }],
        select: {
            id: true, name: true, slug: true, url: true, target: true, parentId: true,
            pageId: true, deletedAt: true, deletedById: true,
            viewTypeRelation: { select: { id: true, name: true } },
        },
    })
})
