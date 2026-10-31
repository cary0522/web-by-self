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
        summary: '建立網站 menu 設定',
        description: '如果是 page/pdf 等需要頁面的 viewType，會自動建立 page，並更新 page 內容',
    },
})

// /api/siteMenu/create 建立網站 menu 設定
export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const body = requireObjectBody(await readBody<unknown>(event))
    const menuFields = parseSiteMenuFields(body)

    if (!body.siteId) {
        throw createError({
            statusCode: 400,
            message: '網站 ID 為必填',
        })
    }

    const siteId = Number(body.siteId)
    if (!Number.isInteger(siteId) || siteId <= 0) {
        throw createError({ statusCode: 400, message: '網站 ID 格式錯誤' })
    }

    await requireSiteOwnerById(authUser.id, siteId)

    const parentId = body.parentId === undefined || body.parentId === null || body.parentId === ''
        ? null
        : Number(body.parentId)
    if (parentId !== null) {
        if (!Number.isInteger(parentId) || parentId <= 0) {
            throw createError({ statusCode: 400, message: '父層頁籤 ID 格式錯誤' })
        }
    }

    const res = await prisma.$transaction(async (tx) => {
        await lockSiteMenuHierarchy(tx, siteId)

        const [viewType, siteMenus] = await Promise.all([
            tx.viewType.findUnique({
                where: { id: menuFields.viewTypeId },
                select: { name: true },
            }),
            tx.siteMenu.findMany({
                where: { siteId, isDeleted: false },
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
        assertValidMenuParent(siteMenus, parentId)
        assertHomeMenuAvailable(siteMenus, viewType.name)
        const destination = parseSiteMenuDestination(body, viewType.name)

        const needsPage = viewTypeRequiresPage(viewType.name)
        let pageId: number | null = null

        // 如果需要 page，建立新的 page
        if (needsPage) {
            const page = await tx.page.create({
                data: {
                    title: menuFields.name,
                    content: menuFields.content,
                    status: 1,
                    siteId,
                    createdBy: authUser.id,
                    updatedBy: authUser.id,
                },
            })

            pageId = page.id
        }

        return tx.siteMenu.create({
            data: {
                name: menuFields.name,
                ...destination,
                viewTypeId: menuFields.viewTypeId,
                sortOrder: menuFields.sortOrder,
                isEnabled: menuFields.isEnabled ?? true,
                icon: menuFields.icon,
                siteId,
                parentId,
                pageId,
                createdById: authUser.id,
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
        sortOrder: res.sortOrder,
        isEnabled: res.isEnabled,
        parentId: res.parentId,
        pageId: res.pageId,
    }
})
