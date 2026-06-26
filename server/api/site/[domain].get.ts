import { getSiteByDomain, getSiteMenusBySiteId } from '../../utils/site'

defineRouteMeta({
    openAPI: {
        tags: ['site'],
        summary: '取得網站設定',
        description: '取得網站設定',
        parameters: [
            {
                in: 'path',
                name: 'domain',
                required: true,
            },
        ],
    },
})

// /api/site/domain GET 取得網站設定
export default defineEventHandler(async (event) => {
    const domain = getRouterParam(event, 'domain')
    if (!domain) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Domain is required',
        })
    }

    const siteConfig = await getSiteByDomain(domain)

    // 尚未建立網站時回傳 null
    if (!siteConfig) return null
    // 取得網站頁面總表
    const siteMenu = await getSiteMenusBySiteId(siteConfig.id)

    return siteMenu
})
