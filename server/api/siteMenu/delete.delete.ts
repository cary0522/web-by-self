import { requiresPageForViewType } from '../../utils/viewType'

defineRouteMeta({
    openAPI: {
        tags: ['siteMenu'],
        summary: '刪除網站 menu 設定',
        description: '如果是 page/pdf 等需要頁面的 viewType，會自動將 page 的 status 設為 0',
    },
})

// /api/siteMenu/delete 刪除網站設定
export default defineEventHandler(async (event) => {
    requireAuth(event)
    const body = await readBody(event)

    if (!body.menuId) {
        throw createError({
            statusCode: 400,
            statusMessage: '頁籤 ID 為必填',
        })
    }


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

        // 判斷是否需要刪除page
        let needsDeletePage = currentMenu.viewTypeId ? await requiresPageForViewType(currentMenu.viewTypeId) : false
        let pageId = currentMenu.pageId
        // 如果需要刪除 page 且目前有 pageId，則將 page 的 status 設為 0
        if (needsDeletePage && pageId) {
            await tx.page.update({
                where: { id: pageId },
                data: {
                    status: 0,
                },
            })
        }

        return tx.siteMenu.update({
            where: {
                id: body.menuId,
            },
            data: {
                isEnabled: false,
                isDeleted: true
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