import { requiresPageForViewType } from '../../utils/viewType'

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
    if (!body.siteId) {
        throw createError({
            statusCode: 400,
            statusMessage: '網站 ID 為必填',
        })
    }

    const needsPage = await requiresPageForViewType(body.viewTypeId)

    const res = await prisma.$transaction(async (tx) => {
        let pageId: number | null = null

        if (needsPage) {
            const page = await tx.page.create({
                data: {
                    title: body.name,
                    content: body.content ?? null,
                    status: 1,
                    siteId: body.siteId,
                    createdBy: authUser.id,
                    updatedBy: authUser.id,
                },
            })

            pageId = page.id
        }

        return tx.siteMenu.create({
            data: {
                name: body.name,
                slug: body.slug,
                viewTypeId: body.viewTypeId,
                siteId: body.siteId,
                parentId: body.parentId,
                pageId,
                createdById: authUser.id,
            },
        })
    })

    return {
        id: res.id,
        name: res.name,
        slug: res.slug,
        viewTypeId: res.viewTypeId,
        parentId: res.parentId,
        pageId: res.pageId,
    }
})