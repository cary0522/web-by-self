import { prisma } from '../../utils/prisma'
import { requireAdmin } from '../../utils/auth'
import {
    assertHomeMenuAvailable,
    assertValidMenuParent,
    isUniqueConstraintError,
    lockSiteMenuHierarchy,
    parseSiteMenuFields,
    parseSiteMenuDestination,
    requireObjectBody,
} from '../../utils/site-menu'
import { viewTypeRequiresPage } from '../../utils/viewType'

defineRouteMeta({
    openAPI: {
        tags: ['siteMenu'],
        summary: '更新網站 menu 設定',
        description: '如果是 page/pdf 等需要頁面的 viewType，會自動建立 page，並更新 page 內容',
    },
})

// /api/siteMenu/update 更新網站設定
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
    const menuFields = parseSiteMenuFields(body)
    const parentId = body.parentId === undefined || body.parentId === null || body.parentId === ''
        ? null
        : Number(body.parentId)
    if (parentId !== null) {
        if (!Number.isInteger(parentId) || parentId <= 0) {
            throw createError({ statusCode: 400, message: '父層頁籤 ID 格式錯誤' })
        }
    }

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

        const [viewType, siteMenus] = await Promise.all([
            tx.viewType.findUnique({
                where: { id: menuFields.viewTypeId },
                select: { name: true },
            }),
            tx.siteMenu.findMany({
                where: { siteId: currentMenu.siteId, isDeleted: false },
                select: {
                    id: true,
                    parentId: true,
                    viewTypeRelation: { select: { name: true } },
                },
            }),
        ])
        if (!viewType) {
            throw createError({ statusCode: 400, message: 'viewType 不存在' })
        }
        assertValidMenuParent(siteMenus, parentId, menuId)
        assertHomeMenuAvailable(siteMenus, viewType.name, menuId)
        const destination = parseSiteMenuDestination(body, viewType.name)

        const needsPage = viewTypeRequiresPage(viewType.name)

        let pageId = currentMenu.pageId
        if (needsPage) {
            if (pageId) {
                await tx.page.update({
                    where: { id: pageId },
                    data: {
                        title: menuFields.name,
                        content: menuFields.hasContent ? menuFields.content : undefined,
                        updatedBy: authUser.id,
                    },
                })
            } else {
                const page = await tx.page.create({
                    data: {
                        title: menuFields.name,
                        content: menuFields.content,
                        status: 1,
                        siteId: currentMenu.siteId,
                        createdBy: authUser.id,
                        updatedBy: authUser.id,
                    },
                })
                pageId = page.id
            }
        } else if (pageId) {
            // A Page is archived and detached when the selected ViewType no longer uses one.
            await tx.page.update({
                where: { id: pageId },
                data: { status: 0, updatedBy: authUser.id, archivedAt: new Date(), archivedBy: authUser.id },
            })
            pageId = null
        }

        return tx.siteMenu.update({
            where: {
                id: menuId,
            },
            data: {
                name: menuFields.name,
                ...destination,
                viewTypeId: menuFields.viewTypeId,
                sortOrder: menuFields.sortOrder,
                isEnabled: menuFields.isEnabled,
                icon: menuFields.icon,
                parentId,
                pageId,
            },
        })
    }).catch((error: unknown) => {
        if (isUniqueConstraintError(error)) {
            throw createError({ statusCode: 409, message: '此網站已存在相同的頁籤 slug' })
        }
        throw error
    })

    return {
        id: res.id,
        name: res.name,
        slug: res.slug,
        url: res.url,
        target: res.target,
        icon: res.icon,
        viewTypeId: res.viewTypeId,
        parentId: res.parentId,
        pageId: res.pageId,
        sortOrder: res.sortOrder,
        isEnabled: res.isEnabled,
    }
})
