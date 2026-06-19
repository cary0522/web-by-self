// /api/siteMenu/:id 取得網站 menu 設定
export default defineEventHandler(async (event) => {
    requireAuth(event)
    const siteId = Number(getRouterParam(event, 'id'))

    const siteMenus = await prisma.siteMenu.findMany({
        where: {
            siteId,
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
                    name: true,
                },
            },
        },
    })

    return siteMenus.map(menu => ({
        id: menu.id,
        name: menu.name,
        slug: menu.slug,
        viewType: menu.viewTypeRelation?.name ?? '',
    }))
})