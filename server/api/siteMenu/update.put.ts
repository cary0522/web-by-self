import { requiresPageForViewType } from '../../utils/viewType'

defineRouteMeta({
    openAPI: {
        tags: ['siteMenu'],
        summary: '更新網站 menu 設定',
        description: '如果是 page/pdf 等需要頁面的 viewType，會自動建立 page，並更新 page 內容',
    },
})

// /api/siteMenu/update 更新網站設定
export default defineEventHandler(async (event) => {
    requireAuth(event)
    const body = await readBody(event)

    if (!body.menuId) {
        throw createError({
            statusCode: 400,
            statusMessage: '頁籤 ID 為必填',
        })
    }

    if (!body.name) {
        throw createError({
            statusCode: 400,
            statusMessage: '頁籤名稱為必填',
        })
    }
    // 判斷是否需要新增page
    const needsPage = body.viewTypeId ? await requiresPageForViewType(body.viewTypeId) : false

    const res = await prisma.$transaction(async (tx) => {
        const currentMenu = await tx.siteMenu.findUnique({
            where: {
                id: body.menuId,
            },
        })

        if (!currentMenu) {
            throw createError({
                statusCode: 404,
                statusMessage: '頁籤不存在',
            })
        }

        let pageId = currentMenu.pageId
        // 如果需要 page 但目前沒有 pageId，則建立新的 page
        if (needsPage && !pageId) {
            const page = await tx.page.create({
                data: {
                    title: body.name,
                    content: body.content ?? null,
                    status: 1,
                    siteId: currentMenu.siteId,
                    createdBy: currentMenu.createdById,
                    updatedBy: currentMenu.createdById,
                },
            })
            pageId = page.id
        }

        // 如果需要 page 且已有 pageId，則更新 page 內容
        if (needsPage && pageId) {
            await tx.page.update({
                where: { id: pageId },
                data: {
                    title: body.name,
                    content: body.content ?? undefined,
                },
            })
        }

        return tx.siteMenu.update({
            where: {
                id: body.menuId,
            },
            data: {
                name: body.name,
                slug: body.slug,
                viewTypeId: body.viewTypeId,
                parentId: body.parentId,
                pageId,
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