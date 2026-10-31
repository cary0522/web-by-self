import { handleSiteWriteError, parseSiteFields } from '../../utils/site-domain'

defineRouteMeta({
    openAPI: {
        tags: ['site'],
        summary: '更新網站設定',
        description: '更新網站設定',
    },
})

// /api/site/update 更新網站設定
export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const body = await readBody<unknown>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw createError({
            statusCode: 400,
            message: 'Request body 格式錯誤',
        })
    }
    const requestBody = body as Record<string, unknown>
    if (!requestBody.siteId) {
        throw createError({
            statusCode: 400,
            message: '網站 ID 為必填',
        })
    }
    const fields = parseSiteFields(requestBody)
    const siteId = Number(requestBody.siteId)
    if (!Number.isInteger(siteId) || siteId <= 0) {
        throw createError({
            statusCode: 400,
            message: '網站 ID 格式錯誤',
        })
    }

    await requireSiteOwnerById(authUser.id, siteId)

    const res = await prisma.site.update({
        where: {
            id: siteId,
        },
        data: fields,
    }).catch(handleSiteWriteError)

    return {
        id: res.id,
        name: res.name,
        domain: res.domain,
    }
})
