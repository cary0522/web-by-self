import { prisma } from '../../utils/prisma'
import { requireAdmin } from '../../utils/auth'
import {
    getFileContentPath,
    getFileDownloadPath,
    getFilePreviewType,
    removeStoredFile,
    saveUploadedFileToSite,
} from '../../utils/file'
import { discardStagedUpload, parseMultipartUpload } from '../../utils/upload'

defineRouteMeta({
    openAPI: {
        tags: ['file'],
        summary: '上傳檔案',
        description: '上傳檔案到指定的網站或頁面',
    },
})

export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const { fields, file } = await parseMultipartUpload(event)
    if (!file) {
        throw createError({ statusCode: 400, message: '找不到檔案欄位' })
    }

    try {
        const siteIdValue = fields.siteId
        if (!siteIdValue) {
            throw createError({ statusCode: 400, message: 'siteId 為必填' })
        }

        const siteId = Number(siteIdValue)
        if (!Number.isInteger(siteId) || siteId <= 0) {
            throw createError({ statusCode: 400, message: 'siteId 格式錯誤' })
        }

        const pageIdValue = fields.pageId
        const pageId = pageIdValue ? Number(pageIdValue) : undefined
        if (pageIdValue && (!Number.isInteger(pageId!) || pageId! <= 0)) {
            throw createError({ statusCode: 400, message: 'pageId 格式錯誤' })
        }

        const categoryValue = fields.category
        const allowedCategories = ['file', 'page', 'news']
        if (categoryValue && !allowedCategories.includes(categoryValue)) {
            throw createError({ statusCode: 400, message: 'category 格式錯誤，僅可為 file、page 或 news' })
        }

        let category: 'file' | 'page' | 'news' = pageId ? 'page' : 'file'
        if (categoryValue) {
            category = categoryValue as 'file' | 'page' | 'news'
        }
        if (category === 'page' && !pageId) {
            throw createError({ statusCode: 400, message: '若 category 為 page，必須提供 pageId' })
        }

        await requireSiteOwnerById(authUser.id, siteId)

        let targetPage: Awaited<ReturnType<typeof requirePageOwner>> | undefined
        if (pageId) {
            const page = await requirePageOwner(authUser.id, pageId)
            targetPage = page
            if (page.siteId !== siteId) {
                throw createError({ statusCode: 403, message: '無權將 page 關聯到其他 site' })
            }
        }

        let newlyStoredPath: string | undefined
        try {
            const fileRecord = await prisma.$transaction(async (tx) => {
                const record = await saveUploadedFileToSite(siteId, authUser.id, file, category, tx)
                newlyStoredPath = record.path
                if (pageId) {
                    if (targetPage?.relatedFileID && targetPage.relatedFileID !== record.id) {
                        await tx.pageFile.deleteMany({
                            where: { pageId, fileId: targetPage.relatedFileID, usage: 'attachment' },
                        })
                    }
                    await tx.page.update({
                        where: { id: pageId },
                        data: { relatedFileID: record.id },
                    })
                    await tx.pageFile.create({
                        data: { siteId, pageId, fileId: record.id, usage: 'attachment' },
                    })
                }
                return record
            })

            const origin = getRequestURL(event).origin
            const previewType = getFilePreviewType(fileRecord.path)
            const contentPath = getFileContentPath(fileRecord.id)
            const downloadPath = getFileDownloadPath(fileRecord.id)

            return {
                ...fileRecord,
                url: `${origin}${previewType ? contentPath : downloadPath}`,
                downloadUrl: `${origin}${downloadPath}`,
                previewable: previewType !== null,
                previewType,
            }
        } catch (error) {
            if (newlyStoredPath) await removeStoredFile(newlyStoredPath)
            throw error
        }
    } finally {
        await discardStagedUpload(file)
    }
})
