import { getSectionByPageId } from '../../../../utils/section'

defineRouteMeta({
    openAPI: {
        tags: ['page'],
        summary: '取得前台頁面block內容',
        description: '取得前台頁面block內容',
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

// /api/page/:domain/:slug/block 取得前台頁面block內容
export default defineEventHandler(async (event) => {
    const domain = getRouterParam(event, 'domain') as string
    const slug = getRouterParam(event, 'slug') as string

    const sections = await getSectionByPageId(domain, slug, true)

    return sections
})
