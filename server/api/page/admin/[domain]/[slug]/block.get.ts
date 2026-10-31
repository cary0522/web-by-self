import { getSectionByPageId } from '../../../../../utils/section'
import { requireAdmin } from '../../../../../utils/auth'

defineRouteMeta({
    openAPI: {
        tags: ['page'],
        summary: '取得頁面block內容',
        description: '取得頁面block內容',
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

// /api/page/admin/:domain/:slug/block 取得頁面block內容
export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const domain = getRouterParam(event, 'domain') as string
    const slug = getRouterParam(event, 'slug') as string

    await requireSiteOwnerByDomain(authUser.id, domain)

    const sections = await getSectionByPageId(domain, slug)

    return sections
})
