// /api/siteMenu/:id 取得網站 menu 設定
export default defineEventHandler(async (event) => {
    const authUser = requireAuth(event)
    const body = await readBody(event)


    if (!body.name) {
        throw createError({
            statusCode: 400,
            statusMessage: '網站名稱為必填',
        })
    }
    if (!body.slug) {
        throw createError({
            statusCode: 400,
            statusMessage: '網站 slug 為必填',
        })
    }
    if (body.viewTypeId == 0) {
        throw createError({
            statusCode: 400,
            statusMessage: '網站 viewType 為必填',
        })
    }

    const res = await prisma.siteMenu.create({
        data: {
            name: body.name,
            slug: body.slug,
            viewTypeId: body.viewTypeId,
            siteId: body.siteId,
            createdById: authUser.id,
        },
    })

    return {
        id: res.id,
        name: res.name,
        slug: res.slug,
        viewTypeId: res.viewTypeId,
    }
})