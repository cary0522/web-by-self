import { requireAdmin } from '../../../utils/auth'
import { requireSiteOwnerById } from '../../../utils/ownership'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const siteId = Number(getRouterParam(event, 'siteId'))
    if (!Number.isInteger(siteId) || siteId <= 0) throw createError({ statusCode: 400, message: 'site ID 格式錯誤' })
    await requireSiteOwnerById(authUser.id, siteId)
    return prisma.file.findMany({
        where: { siteId, deletedAt: null },
        orderBy: [{ uploadedAt: 'desc' }, { id: 'desc' }],
        select: {
            id: true, name: true, category: true, mimeType: true, sizeBytes: true,
            isPublic: true, uploadedBy: true, uploadedAt: true,
        },
    })
})
