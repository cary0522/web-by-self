import { getPageContent } from '../../../utils/page'

defineRouteMeta({
    openAPI: {
        tags: ['page'],
        summary: '取得前台頁面內容',
        description: '取得前台頁面內容',
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

// /api/page/:domain/:slug 取得前台頁面內容，只回傳啟用中的 page
export default defineEventHandler(async (event) => {
    const domain = getRouterParam(event, 'domain') as string
    const slug = getRouterParam(event, 'slug') as string

    const page = await getPageContent(domain, slug, true)

    return page
})
