// /api/site/update 更新網站設定
export default defineEventHandler(async (event) => {
    requireAuth(event)
    const body = await readBody(event)

    if (!body.siteId) {
        throw createError({
            statusCode: 400,
            statusMessage: '網站 ID 為必填',
        })
    }

    if (!body.name) {
        throw createError({
            statusCode: 400,
            statusMessage: '網站名稱為必填',
        })
    }

    const res = await prisma.site.update({
        where: {
            id: body.siteId,
        },
        data: {
            name: body.name,
            domain: body.domain,
        },
    })

    return {
        id: res.id,
        name: res.name,
        domain: res.domain,
    }
})