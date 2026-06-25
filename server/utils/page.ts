import { prisma } from './prisma'
import { getSiteByDomain } from './site'

export async function getPageContent(domain: string, slug: string, status?: boolean) {

    if (!domain || !slug) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Domain 與 slug 為必填',
        })
    }

    const site = await getSiteByDomain(domain)
    if (!site) {
        throw createError({
            statusCode: 400,
            statusMessage: '沒有此 site',
        })
    }

    const siteMenu = await prisma.siteMenu.findFirst({
        where: {
            siteId: site.id,
            slug: '/' + slug,
            isDeleted: false,
        },
        include: {
            viewTypeRelation: true,
            page: {
                include: {
                    sections: {
                        orderBy: {
                            sortOrder: 'asc',
                        },
                    },
                },
            },
        },
    })

    if (!siteMenu) {
        throw createError({
            statusCode: 400,
            statusMessage: '沒有此 siteMenu',
        })
    }

    const viewTypeName = siteMenu.viewTypeRelation?.name?.toLowerCase()
    const requiredPageStatus = typeof status === 'boolean' ? Number(status) : null

    if (requiredPageStatus !== null && (viewTypeName === 'page' || viewTypeName === 'pdf')) {
        if (siteMenu.page?.status !== requiredPageStatus) {
            throw createError({
                statusCode: 404,
                statusMessage: '沒有此 page',
            })
        }
    }

    if (viewTypeName === 'page' || viewTypeName === 'pdf') {
        return siteMenu.page
    }

    return siteMenu
}