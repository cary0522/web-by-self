import { requireAdmin } from '../../utils/auth'
import { requireSiteMenuOwner } from '../../utils/ownership'
import { prisma } from '../../utils/prisma'
import { getMenuSubtreeIds, isUniqueConstraintError, lockSiteMenuHierarchy, requireObjectBody } from '../../utils/site-menu'

export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const body = requireObjectBody(await readBody<unknown>(event))
    const menuId = Number(body.menuId)
    if (!Number.isInteger(menuId) || menuId <= 0) throw createError({ statusCode: 400, message: '頁籤 ID 格式錯誤' })
    const ownedMenu = await requireSiteMenuOwner(authUser.id, menuId)

    return prisma.$transaction(async (tx) => {
        await lockSiteMenuHierarchy(tx, ownedMenu.siteId)
        const menus = await tx.siteMenu.findMany({
            where: { siteId: ownedMenu.siteId },
            select: { id: true, parentId: true, pageId: true, slug: true, isDeleted: true, viewTypeRelation: { select: { name: true } } },
        })
        const root = menus.find(menu => menu.id === menuId)
        if (!root || !root.isDeleted) throw createError({ statusCode: 404, message: '找不到已刪除的頁籤' })
        const ids = getMenuSubtreeIds(menus, menuId)
        const restoring = menus.filter(menu => ids.includes(menu.id) && menu.isDeleted)
        const activeHomeExists = menus.some(menu => !menu.isDeleted && menu.viewTypeRelation.name.toLowerCase() === 'home')
        const restoresHome = restoring.some(menu => menu.viewTypeRelation.name.toLowerCase() === 'home')
        if (activeHomeExists && restoresHome) throw createError({ statusCode: 409, message: '此網站已存在首頁頁籤' })

        const pageIds = restoring.flatMap(menu => menu.pageId === null ? [] : [menu.pageId])
        if (pageIds.length > 0) {
            await tx.page.updateMany({
                where: { id: { in: pageIds }, siteId: ownedMenu.siteId },
                data: { status: 1, archivedAt: null, archivedBy: null, updatedBy: authUser.id },
            })
        }
        await Promise.all(restoring.map(menu => tx.siteMenu.update({
            where: { id: menu.id },
            data: {
                isDeleted: false,
                isEnabled: true,
                activeSlug: menu.slug,
                deletedAt: null,
                deletedById: null,
            },
        })))
        return { restoredIds: restoring.map(menu => menu.id) }
    }).catch((error: unknown) => {
        if (isUniqueConstraintError(error)) {
            throw createError({ statusCode: 409, message: '頁籤 slug 已被其他頁籤使用，無法還原' })
        }
        throw error
    })
})
