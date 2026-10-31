import { insertSection } from '../../../../../utils/section'
import { requireAdmin } from '../../../../../utils/auth'

defineRouteMeta({
    openAPI: {
        tags: ['page'],
        summary: '新增頁面block內容',
        description: '新增頁面block內容',
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

// /api/page/admin/:domain/:slug/block 新增前台頁面block內容
export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)

    const body = await readBody(event)

    if (!body) {
        throw createError({
            statusCode: 400,
            message: 'Body is required'
        })
    }

    const domain = getRouterParam(event, 'domain') as string
    const slug = getRouterParam(event, 'slug') as string

    const section = await insertSection(domain, slug, body, authUser.id)

    return section
})
