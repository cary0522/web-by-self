import { prisma } from './prisma'
import { normalizeSiteDomain } from './site-domain'
import { buildSiteMenuTree } from './site-menu'

export async function getSiteByDomain(domain: string) {
    return prisma.site.findUnique({
        where: {
            domain: normalizeSiteDomain(domain),
        },
    })
}

export async function getSiteByCreatedById(createdById: number) {
    return prisma.site.findFirst({
        where: {
            createdById,
        },
        // A user may own multiple sites. Always select the latest one and use
        // the primary key as a deterministic tie-breaker.
        orderBy: [
            { createdAt: 'desc' },
            { id: 'desc' },
        ],
    })
}

type GetSiteMenusOptions = {
    includeDisabled?: boolean
}

export async function getSiteMenusBySiteId(siteId: number, options: GetSiteMenusOptions = {}) {
    const siteMenus = await prisma.siteMenu.findMany({
        where: {
            siteId,
            isDeleted: false,
            ...(!options.includeDisabled && { isEnabled: true }),
        },
        orderBy: [
            { sortOrder: 'asc' },
            { id: 'asc' },
        ],
        select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            url: true,
            target: true,
            pageId: true,
            sortOrder: true,
            isEnabled: true,
            viewTypeRelation: {
                select: {
                    id: true,
                    name: true,
                },
            },
            parentId: true,
        },
    })

    return buildSiteMenuTree(siteMenus)
}
