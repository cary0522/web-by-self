import { prisma } from './prisma'
import { getSiteByDomain } from './site'

export async function getPageContent(domain: string, slug: string, status?: boolean) {

    if (!domain || !slug) {
        throw createError({
            statusCode: 400,
            message: 'Domain 與 slug 為必填',
        })
    }

    const site = await getSiteByDomain(domain)
    if (!site) {
        throw createError({
            statusCode: 400,
            message: '沒有此 site',
        })
    }

    if (slug === 'home') {
        const siteMenu = await prisma.siteMenu.findFirst({
            where: {
                siteId: site.id,
                isDeleted: false,
                viewTypeRelation: {
                    name: 'home',
                },
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
                message: '沒有此 siteMenu',
            })
        }

        return siteMenu
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
            message: '沒有此 siteMenu',
        })
    }

    const viewTypeName = siteMenu.viewTypeRelation?.name?.toLowerCase()
    const requiredPageStatus = typeof status === 'boolean' ? Number(status) : null

    if (requiredPageStatus !== null && (viewTypeName === 'page' || viewTypeName === 'pdf')) {
        if (siteMenu.page?.status !== requiredPageStatus) {
            throw createError({
                statusCode: 404,
                message: '沒有此 page',
            })
        }
    }

    if (viewTypeName === 'page' || viewTypeName === 'pdf') {
        return siteMenu.page
    }

    return siteMenu
}

export async function getPageId(domain: string, slug: string) {
    if (!domain || !slug) {
        throw createError({
            statusCode: 400,
            message: 'Domain 與 slug 為必填',
        })
    }

    const site = await getSiteByDomain(domain)
    if (!site) {
        throw createError({
            statusCode: 400,
            message: '沒有此 site',
        })
    }

    if (slug === 'home') {
        const siteMenu = await prisma.siteMenu.findFirst({
            where: {
                siteId: site.id,
                isDeleted: false,
                viewTypeRelation: {
                    name: 'home',
                },
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
                message: '沒有此 siteMenu',
            })
        }

        return siteMenu.pageId
    }

    const siteMenu = await prisma.siteMenu.findFirst({
        where: {
            siteId: site.id,
            slug: '/' + slug,
            isDeleted: false,
        },
    })

    if (!siteMenu) {
        throw createError({
            statusCode: 400,
            message: '沒有此 siteMenu',
        })
    }

    return siteMenu.pageId
}