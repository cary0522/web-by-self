// /api/site/create 新增網站設定
export default defineEventHandler(async (event) => {
    const authUser = requireAuth(event)
    const body = await readBody(event)

    if (!body.name) {
        throw createError({
            statusCode: 400,
            statusMessage: '網站名稱為必填',
        })
    }

    const res = await prisma.site.create({
        data: {
            name: body.name,
            domain: body.domain,
            createdById: authUser.id,
        },
    })

    return {
        id: res.id,
        name: res.name,
        domain: res.domain,
    }
})