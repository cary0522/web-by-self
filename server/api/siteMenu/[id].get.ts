import { getSiteMenusBySiteId } from '../../utils/site'

defineRouteMeta({
    openAPI: {
        tags: ['siteMenu'],
        summary: '取得網站 menu 設定',
        description: '包含所有根頁籤、停用狀態及任意深度的 subPage 階層',
        parameters: [
            {
                in: 'path',
                name: 'id',
                required: true,
            },
        ],
    },
})

// /api/siteMenu/:id 取得網站 menu 設定
export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const siteId = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(siteId) || siteId <= 0) {
        throw createError({ statusCode: 400, message: 'site ID 格式錯誤' })
    }

    await requireSiteOwnerById(authUser.id, siteId)

    return getSiteMenusBySiteId(siteId, { includeDisabled: true })
})
