// /api/site/domain GET 取得網站設定
export default defineEventHandler(async (event) => {
    const domain = getRouterParam(event, 'domain')
    const siteConfig = await prisma.site.findFirst({
        where: {
            domain: '/' + domain,
        },
    })

    // 尚未建立網站時回傳 null
    if (!siteConfig) return null
    // 取得網站頁面總表
    const siteMenu = await prisma.siteMenu.findMany({
        where: {
            siteId: siteConfig.id,
            isDeleted: false,
        },
        orderBy: {
            sortOrder: 'asc',
        },
        select: {
            id: true,
            name: true,
            slug: true,
            viewTypeRelation: {
                select: {
                    id: true,
                },
            },
        },
    })

    return siteMenu
})
