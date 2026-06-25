import { getPageContent } from '../../../../utils/page'
import { requireAuth } from '../../../../utils/auth'

// /api/siteMenu/admin/:domain/:slug 取得後台頁面內容，需登入，可回傳所有狀態的 page
export default defineEventHandler(async (event) => {
    requireAuth(event)

    const domain = getRouterParam(event, 'domain') as string
    const slug = getRouterParam(event, 'slug') as string

    const siteMenu = await getPageContent(domain, slug)

    return siteMenu
})