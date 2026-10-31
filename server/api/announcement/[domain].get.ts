import { getSiteByDomain } from '../../utils/site'

export default defineEventHandler(async (event) => {
    const domain = getRouterParam(event, 'domain') || ''
    const limitValue = Number(getQuery(event).limit ?? 20)
    const limit = Number.isInteger(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 20
    const site = await getSiteByDomain(domain)
    if (!site) throw createError({ statusCode: 404, message: '沒有此 site' })

    const now = new Date()
    return prisma.announcement.findMany({
        where: {
            siteId: site.id,
            isEnabled: true,
            deletedAt: null,
            publishedAt: { lte: now },
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        take: limit,
        select: { id: true, title: true, content: true, publishedAt: true },
    })
})
