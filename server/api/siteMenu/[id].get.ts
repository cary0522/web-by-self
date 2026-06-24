import { getSiteMenusBySiteId } from '../../utils/site'

// /api/siteMenu/:id 取得網站 menu 設定
export default defineEventHandler(async (event) => {
    requireAuth(event)
    const siteId = Number(getRouterParam(event, 'id'))

    const siteMenus = await getSiteMenusBySiteId(siteId)

    return siteMenus.filter(menu => (
        menu.viewTypeRelation?.name === 'parent' || menu.viewTypeRelation?.name === 'home'
    )).map(menu => ({
        id: menu.id,
        name: menu.name,
        slug: menu.slug,
        pageId: menu.pageId,
        viewTypeId: menu.viewTypeRelation?.id ?? 0,
        viewType: menu.viewTypeRelation?.name,
        subPage: siteMenus.filter(subMenu => subMenu.parentId == menu.id).map(subMenu => ({
            id: subMenu.id,
            name: subMenu.name,
            slug: subMenu.slug,
            pageId: subMenu.pageId,
            viewTypeId: subMenu.viewTypeRelation?.id ?? 0,
            viewType: subMenu.viewTypeRelation?.name,
            parentId: subMenu.parentId,
        }))
    }))
})