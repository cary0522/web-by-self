import { requireAdmin } from '../../../../utils/auth'
import { requireSiteOwnerByDomain } from '../../../../utils/ownership'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const site = await requireSiteOwnerByDomain(authUser.id, getRouterParam(event, 'domain') || '')

    return prisma.announcement.findMany({
        where: { siteId: site.id, deletedAt: { not: null } },
        orderBy: [{ deletedAt: 'desc' }, { id: 'desc' }],
    })
})
