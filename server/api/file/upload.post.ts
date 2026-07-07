import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { saveUploadedFileToSite, getFilePreviewType } from '../../utils/file'

defineRouteMeta({
    openAPI: {
        tags: ['file'],
        summary: '上傳檔案',
        description: '上傳檔案到指定的網站或頁面',
    },
})

export default defineEventHandler(async (event) => {
    const authUser = requireAuth(event)
    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
        throw createError({ statusCode: 400, statusMessage: '請上傳檔案' })
    }

    const filePart = formData.find(part => part.filename)
    if (!filePart) {
        throw createError({ statusCode: 400, statusMessage: '找不到檔案欄位' })
    }

    const siteIdValue = formData.find(part => part.name === 'siteId')?.data.toString()
    if (!siteIdValue) {
        throw createError({ statusCode: 400, statusMessage: 'siteId 為必填' })
    }

    const siteId = Number(siteIdValue)
    if (Number.isNaN(siteId) || siteId <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'siteId 格式錯誤' })
    }

    const pageIdValue = formData.find(part => part.name === 'pageId')?.data.toString()
    const pageId = pageIdValue ? Number(pageIdValue) : undefined
    if (pageIdValue && (Number.isNaN(pageId!) || pageId! <= 0)) {
        throw createError({ statusCode: 400, statusMessage: 'pageId 格式錯誤' })
    }

    const categoryValue = formData.find(part => part.name === 'category')?.data.toString()
    const allowedCategories = ['file', 'page', 'news']
    if (categoryValue && !allowedCategories.includes(categoryValue)) {
        throw createError({ statusCode: 400, statusMessage: 'category 格式錯誤，僅可為 file、page 或 news' })
    }

    let category: 'file' | 'page' | 'news' = pageId ? 'page' : 'file'
    if (categoryValue) {
        category = categoryValue as 'file' | 'page' | 'news'
    }
    if (category === 'page' && !pageId) {
        throw createError({ statusCode: 400, statusMessage: '若 category 為 page，必須提供 pageId' })
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } })
    if (!site) {
        throw createError({ statusCode: 404, statusMessage: '找不到 site' })
    }

    const fileRecord = await saveUploadedFileToSite(siteId, authUser.id, filePart, category)

    if (pageId) {
        const page = await prisma.page.findUnique({ where: { id: pageId } })
        if (!page) {
            throw createError({ statusCode: 404, statusMessage: '找不到 page' })
        }
        if (page.siteId !== siteId) {
            throw createError({ statusCode: 400, statusMessage: 'page 與 siteId 不一致' })
        }
        await prisma.page.update({
            where: { id: pageId },
            data: { relatedFileID: fileRecord.id },
        })
    }

    const origin = getRequestURL(event).origin
    const previewType = getFilePreviewType(fileRecord.path)

    return {
        ...fileRecord,
        url: `${origin}${fileRecord.path}`,
        downloadUrl: `${origin}/api/file/download/${fileRecord.id}`,
        previewable: previewType !== null,
        previewType,
    }
})
