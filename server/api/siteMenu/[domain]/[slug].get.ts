import { getPageContent } from '../../../utils/page'

// /api/siteMenu/:domain/:slug 取得前台頁面內容，只回傳啟用中的 page
export default defineEventHandler(async (event) => {
    const domain = getRouterParam(event, 'domain') as string
    const slug = getRouterParam(event, 'slug') as string

    const siteMenu = await getPageContent(domain, slug, true)

    return siteMenu
})
