import { requireAdmin } from '../../../../utils/auth'
import { parseAnnouncementBody } from '../../../../utils/announcement'
import { requireSiteOwnerByDomain } from '../../../../utils/ownership'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const domain = getRouterParam(event, 'domain') || ''
    const site = await requireSiteOwnerByDomain(authUser.id, domain)
    const data = parseAnnouncementBody(await readBody<unknown>(event))
    setResponseStatus(event, 201)
    return prisma.announcement.create({
        data: { ...data, title: data.title!, siteId: site.id, createdBy: authUser.id, updatedBy: authUser.id },
    })
})
