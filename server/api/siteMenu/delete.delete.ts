import { getMenuSubtreeIds, lockSiteMenuHierarchy, requireObjectBody } from '../../utils/site-menu'

defineRouteMeta({
    openAPI: {
        tags: ['siteMenu'],
        summary: '刪除網站 menu 設定',
        description: '連同子頁籤一起軟刪除，並停用及解除所有關聯 Page',
    },
})

// /api/siteMenu/delete 刪除網站設定
export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const body = requireObjectBody(await readBody<unknown>(event))

    if (!body.menuId) {
        throw createError({
            statusCode: 400,
            message: '頁籤 ID 為必填',
        })
    }

    const menuId = Number(body.menuId)
    if (!Number.isInteger(menuId) || menuId <= 0) {
        throw createError({ statusCode: 400, message: '頁籤 ID 格式錯誤' })
    }

    const ownedMenu = await requireSiteMenuOwner(authUser.id, menuId)

    const res = await prisma.$transaction(async (tx) => {
        await lockSiteMenuHierarchy(tx, ownedMenu.siteId)

        const currentMenu = await tx.siteMenu.findUnique({
            where: {
                id: menuId,
            },
        })

        if (!currentMenu || currentMenu.isDeleted) {
            throw createError({
                statusCode: 404,
                message: '頁籤不存在',
            })
        }

        const siteMenus = await tx.siteMenu.findMany({
            where: { siteId: currentMenu.siteId, isDeleted: false },
            select: { id: true, parentId: true, pageId: true },
        })
        const menuIds = getMenuSubtreeIds(siteMenus, menuId)
        const menuIdSet = new Set(menuIds)
        const pageIds = siteMenus
            .filter(menu => menuIdSet.has(menu.id) && menu.pageId !== null)
            .map(menu => menu.pageId!)

        // Soft-delete cascades through the subtree. Pages and their relationships are
        // archived but retained so an explicit restore can recover the complete tree.
        if (pageIds.length > 0) {
            await tx.page.updateMany({
                where: { id: { in: pageIds } },
                data: { status: 0, updatedBy: authUser.id, archivedAt: new Date(), archivedBy: authUser.id },
            })
        }

        await tx.siteMenu.updateMany({
            where: { id: { in: menuIds } },
            data: {
                isEnabled: false,
                isDeleted: true,
                activeSlug: null,
                deletedAt: new Date(),
                deletedById: authUser.id,
            },
        })

        return tx.siteMenu.findUniqueOrThrow({ where: { id: menuId } })
    })

    return {
        id: res.id,
        name: res.name,
        slug: res.slug,
        viewTypeId: res.viewTypeId,
        sortOrder: res.sortOrder,
        parentId: res.parentId,
        pageId: res.pageId,
    }
})
