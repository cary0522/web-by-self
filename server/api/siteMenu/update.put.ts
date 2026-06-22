// /api/siteMenu/update 更新網站設定
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
            statusMessage: '頁籤名稱為必填',
        })
    }

    const res = await prisma.siteMenu.update({
        where: {
            id: body.siteId,
        },
        data: {
            name: body.name,
            slug: body.slug,
            viewTypeId: body.viewTypeId,
            parentId: body.parentId,
        },
    })

    return {
        id: res.id,
        name: res.name,
        slug: res.slug,
        viewTypeId: res.viewTypeId,
        parentId: res.parentId,
    }
})