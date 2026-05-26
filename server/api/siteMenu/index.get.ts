// /api/siteMenu GET 取得網站menu設定
export default defineEventHandler(async (event) => {
    const authUser = requireAuth(event)
    const menuId = Number(getRouterParam(event, 'id'))

    const siteMenu = await prisma.siteMenu.findMany({
        where: {
            id: menuId,
        },
    })

    // 尚未建立網站 menu 時回傳 null，由前端判斷顯示建立表單
    if (!siteMenu || siteMenu.length === 0) return null

    return siteMenu.map(menu => ({
        id: menu.id,
        siteId: menu.siteId,
        parentId: menu.parentId,
        pageId: menu.pageId,
        name: menu.name,
        slug: menu.slug,
        viewTypeId: menu.viewTypeId,
        icon: menu.icon,
        sortOrder: menu.sortOrder,
        isEnabled: menu.isEnabled,
        isParent: menu.isParent,
    }))
})
