import { getPageContent } from '../../../../utils/page'
import { requireAdmin } from '../../../../utils/auth'

defineRouteMeta({
    openAPI: {
        tags: ['siteMenu'],
        summary: '取得後台頁面內容',
        description: '提供給管理者使用，需登入，可回傳所有狀態的 page',
        parameters: [
            {
                in: 'path',
                name: 'domain',
                required: true,
            },
            {
                in: 'path',
                name: 'slug',
                required: true,
            },
        ],
    },
})

// /api/siteMenu/admin/:domain/:slug 取得後台頁面內容，需登入，可回傳所有狀態的 page
export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)

    const domain = getRouterParam(event, 'domain') as string
    const slug = getRouterParam(event, 'slug') as string

    await requireSiteOwnerByDomain(authUser.id, domain)

    const siteMenu = await getPageContent(domain, slug)

    return siteMenu
})
