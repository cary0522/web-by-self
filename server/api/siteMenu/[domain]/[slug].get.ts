import { getSiteByDomain } from '../../../utils/site'

// /api/siteMenu/:domain/:slug 取得頁籤設定並取得內容
export default defineEventHandler(async (event) => {
    const domain = getRouterParam(event, 'domain')
    const slug = getRouterParam(event, 'slug')

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
    if (viewTypeName === 'page' || viewTypeName === 'pdf') {
        return siteMenu.page
    }

    return siteMenu
})
