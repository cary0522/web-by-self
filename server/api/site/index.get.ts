import { getSiteByCreatedById } from '../../utils/site'

defineRouteMeta({
    openAPI: {
        tags: ['site'],
        summary: '取得網站設定',
        description: '取得網站設定',
    },
})

// /api/site GET 取得網站設定
export default defineEventHandler(async (event) => {
    const authUser = requireAuth(event)

    const siteConfig = await getSiteByCreatedById(authUser.id)

    // 尚未建立網站時回傳 null，由前端判斷顯示建立表單
    if (!siteConfig) return null

    return {
        id: siteConfig.id,
        name: siteConfig.name,
        domain: siteConfig.domain,
    }
})
