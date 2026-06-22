import { getSiteMenusBySiteId } from '../../utils/site'

// /api/siteMenu/:id 取得網站 menu 設定
export default defineEventHandler(async (event) => {
    requireAuth(event)
    const siteId = Number(getRouterParam(event, 'id'))

    const siteMenus = await getSiteMenusBySiteId(siteId)

    return siteMenus.filter(menu => (
        menu.viewTypeRelation?.id == 4 || menu.viewTypeRelation?.id == 2
    )).map(menu => ({
        id: menu.id,
        name: menu.name,
        slug: menu.slug,
        viewTypeId: menu.viewTypeRelation?.id ?? 0,
        subPage: siteMenus.filter(subMenu => subMenu.parentId == menu.id).map(subMenu => ({
            id: subMenu.id,
            name: subMenu.name,
            slug: subMenu.slug,
            viewTypeId: subMenu.viewTypeRelation?.id ?? 0,
            parentId: subMenu.parentId,
        }))
    }))
})