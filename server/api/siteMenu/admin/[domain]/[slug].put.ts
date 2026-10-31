import { prisma } from '../../../../utils/prisma'
import { requireAdmin } from '../../../../utils/auth'
import { removeStoredFile, saveUploadedFileToSite } from '../../../../utils/file'
import { discardStagedUpload, parseMultipartUpload } from '../../../../utils/upload'
import type { H3Event } from 'h3'
import type { StagedUploadedFile } from '../../../../utils/upload'
import { normalizeSiteMenuSlug } from '../../../../utils/site-menu'

type UpdatePagePayload = {
    id?: number | string
    content?: string | null
    status?: number | string | null
    relatedFileID?: number | string | null
    title?: string | null
}
type ParsedUpdateRequest = {
    payload: UpdatePagePayload
    uploadedFilePart?: StagedUploadedFile
}

defineRouteMeta({
    openAPI: {
        tags: ['siteMenu'],
        summary: '更新後台頁面內容',
        description: '提供給管理者使用，需登入，可回傳所有狀態的 page，並可上傳檔案',
        parameters: [
            {
                in: 'path',
                name: 'domain',
                required: true,
            },
            {
                in: 'path',
                name: 'slug',
                required: true,
            },
        ],
    },
})

// 讀取、統一 request 資料
async function readUpdatePayload(event: H3Event): Promise<ParsedUpdateRequest> {
    const contentType = getRequestHeader(event, 'content-type') || ''

    // 如果是 formdata
    if (contentType.includes('multipart/form-data')) {
        const { fields, file } = await parseMultipartUpload(event)
        const payload: UpdatePagePayload = {
            id: fields.id,
            content: fields.content,
            status: fields.status,
            relatedFileID: fields.relatedFileID,
            title: fields.title,
        }

        return {
            payload,
            uploadedFilePart: file,
        }
    }
    //  如果不是 formdata，則直接讀取 body
    return {
        payload: await readBody(event) as UpdatePagePayload,
    }
}
// /api/siteMenu/admin/:domain/:slug 更新後台頁面內容，需登入，可上傳檔案並回傳所有狀態的 page
export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const domain = getRouterParam(event, 'domain') as string
    const slug = getRouterParam(event, 'slug') as string
    // 先處理 request 資料
    const { payload, uploadedFilePart } = await readUpdatePayload(event)

    try {
        const pageId = Number(payload.id)
        if (!Number.isInteger(pageId) || pageId <= 0) {
            throw createError({
                statusCode: 400,
                message: 'page ID 為必填',
            })
        }

    const site = await requireSiteOwnerByDomain(authUser.id, domain)

    const siteMenu = await prisma.siteMenu.findFirst({
        where: {
            siteId: site.id,
            activeSlug: normalizeSiteMenuSlug(slug),
            isDeleted: false,
        },
        include: {
            viewTypeRelation: true,
            page: true,
        },
    })

    if (!siteMenu) {
        throw createError({
            statusCode: 404,
            message: '沒有此 siteMenu',
        })
    }

    const viewTypeName = siteMenu.viewTypeRelation?.name?.toLowerCase()
    if (viewTypeName !== 'page' && viewTypeName !== 'pdf') {
        throw createError({
            statusCode: 400,
            message: '此頁籤不是可編輯的 page 類型',
        })
    }

    if (!siteMenu.page || siteMenu.page.id !== pageId) {
        throw createError({
            statusCode: 404,
            message: '頁面資料不存在',
        })
    }

    const nextStatus = payload.status === undefined || payload.status === null || payload.status === ''
        ? undefined
        : Number(payload.status)

    if (nextStatus !== undefined && (!Number.isInteger(nextStatus) || ![0, 1].includes(nextStatus))) {
        throw createError({
            statusCode: 400,
            message: 'status 格式錯誤',
        })
    }

    const nextRelatedFileId = payload.relatedFileID === undefined
        ? undefined
        : payload.relatedFileID === null || payload.relatedFileID === ''
            ? null
        : Number(payload.relatedFileID)

    if (nextRelatedFileId !== undefined && nextRelatedFileId !== null
        && (!Number.isInteger(nextRelatedFileId) || nextRelatedFileId <= 0)) {
        throw createError({
            statusCode: 400,
            message: 'relatedFileID 格式錯誤',
        })
    }

    if (typeof nextRelatedFileId === 'number') {
        await requireFileInSite(nextRelatedFileId, site.id)
    }

    if (payload.title !== undefined && payload.title !== null
        && (typeof payload.title !== 'string' || [...payload.title].length > 200)) {
        throw createError({ statusCode: 400, message: 'title 格式錯誤或超過 200 個字元' })
    }
    if (payload.content !== undefined && payload.content !== null
        && (typeof payload.content !== 'string' || Buffer.byteLength(payload.content, 'utf8') > 16_777_215)) {
        throw createError({ statusCode: 400, message: 'content 格式錯誤或超過資料庫限制' })
    }

        let newlyStoredPath: string | undefined
        try {
            const updatedPage = await prisma.$transaction(async (tx) => {
                let relatedFileID = nextRelatedFileId

                if (uploadedFilePart) {
                    const fileRecord = await saveUploadedFileToSite(site.id, authUser.id, uploadedFilePart, 'page', tx)
                    newlyStoredPath = fileRecord.path
                    relatedFileID = fileRecord.id
                }

                if (typeof relatedFileID === 'number') {
                    const existingUsage = await tx.pageFile.findFirst({
                        where: { pageId: siteMenu.page!.id, fileId: relatedFileID, usage: 'attachment', sectionId: null },
                    })
                    if (!existingUsage) {
                        await tx.pageFile.create({
                            data: { siteId: site.id, pageId: siteMenu.page!.id, fileId: relatedFileID, usage: 'attachment' },
                        })
                    }
                }
                if (siteMenu.page!.relatedFileID && siteMenu.page!.relatedFileID !== relatedFileID) {
                    await tx.pageFile.deleteMany({
                        where: { pageId: siteMenu.page!.id, fileId: siteMenu.page!.relatedFileID, usage: 'attachment' },
                    })
                }

                return tx.page.update({
                    where: {
                        id: siteMenu.page!.id,
                    },
                    data: {
                        title: payload.title ?? undefined,
                        content: payload.content ?? undefined,
                        ...(nextStatus !== undefined ? { status: nextStatus } : {}),
                        ...(nextStatus === 1 ? { archivedAt: null, archivedBy: null } : {}),
                        ...(nextStatus === 0 ? { archivedAt: new Date(), archivedBy: authUser.id } : {}),
                        ...(relatedFileID !== undefined ? { relatedFileID } : {}),
                        updatedBy: authUser.id,
                    },
                    include: {
                        file: true,
                        sections: {
                            orderBy: {
                                sortOrder: 'asc',
                            },
                        },
                    },
                })
            })

            return {
                ...updatedPage,
                pageId: updatedPage.id,
            }
        } catch (error) {
            if (newlyStoredPath) await removeStoredFile(newlyStoredPath)
            throw error
        }
    } finally {
        await discardStagedUpload(uploadedFilePart)
    }
})
