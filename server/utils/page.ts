import type { Prisma } from '../../app/generated/prisma/client.js'
import { prisma } from './prisma'
import { getSiteByDomain } from './site'
import { normalizeSiteMenuSlug } from './site-menu'

export type PageVisibility = 'admin' | 'public'

const PUBLISHED_PAGE_STATUS = 1
const PAGE_VIEW_TYPES = new Set(['home', 'page', 'pdf'])

function notFound(message: string) {
    return createError({
        statusCode: 404,
        message,
    })
}

async function getSiteMenuWhere(
    domain: string,
    slug: string,
    visibility: PageVisibility,
): Promise<Prisma.SiteMenuWhereInput> {
    if (!domain || !slug) {
        throw createError({
            statusCode: 400,
            message: 'Domain 與 slug 為必填',
        })
    }

    const site = await getSiteByDomain(domain)
    if (!site) {
        throw notFound('沒有此 site')
    }

    return {
        siteId: site.id,
        isDeleted: false,
        ...(visibility === 'public' ? { isEnabled: true } : {}),
        ...(slug === 'home'
            ? {
                    viewTypeRelation: {
                        name: 'home',
                    },
                }
            : { activeSlug: normalizeSiteMenuSlug(slug) }),
    }
}

export async function getPageContent(
    domain: string,
    slug: string,
    visibility: PageVisibility = 'admin',
) {
    const where = await getSiteMenuWhere(domain, slug, visibility)
    const siteMenu = await prisma.siteMenu.findFirst({
        where,
        include: {
            viewTypeRelation: true,
            page: {
                include: {
                    sections: {
                        where: visibility === 'public' ? { isEnabled: true } : undefined,
                        orderBy: {
                            sortOrder: 'asc',
                        },
                    },
                },
            },
        },
    })

    if (!siteMenu) {
        throw notFound('沒有此 siteMenu')
    }

    const viewTypeName = siteMenu.viewTypeRelation?.name?.toLowerCase()
    const hasPageContent = viewTypeName !== undefined && PAGE_VIEW_TYPES.has(viewTypeName)

    if (visibility === 'public' && hasPageContent && siteMenu.page?.status !== PUBLISHED_PAGE_STATUS) {
        throw notFound('沒有此 page')
    }

    if (viewTypeName === 'page' || viewTypeName === 'pdf') {
        return siteMenu.page
    }

    return siteMenu
}

export async function getPageId(
    domain: string,
    slug: string,
    visibility: PageVisibility = 'admin',
) {
    const where = await getSiteMenuWhere(domain, slug, visibility)
    const siteMenu = await prisma.siteMenu.findFirst({
        where: {
            ...where,
            ...(visibility === 'public'
                ? {
                        page: {
                            status: PUBLISHED_PAGE_STATUS,
                        },
                    }
                : {}),
        },
        select: {
            pageId: true,
        },
    })

    if (!siteMenu) {
        throw notFound('沒有此 siteMenu')
    }

    return siteMenu.pageId
}
