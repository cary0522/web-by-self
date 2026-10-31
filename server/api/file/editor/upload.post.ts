import { requireAdmin } from '../../../utils/auth'
import { getFileContentPath, saveUploadedFileToSite } from '../../../utils/file'
import { discardStagedUpload, parseMultipartUpload } from '../../../utils/upload'
import { prisma } from '../../../utils/prisma'

defineRouteMeta({
    openAPI: {
        tags: ['file'],
        summary: 'CKEditor 圖片上傳',
        description: '提供 CKEditor simpleUpload 使用，將圖片儲存為 site 檔案',
    },
})

export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const domain = String(getQuery(event).domain || '')
    if (!domain) {
        throw createError({ statusCode: 400, message: 'domain 為必填' })
    }

    const site = await requireSiteOwnerByDomain(authUser.id, domain)
    const pageId = Number(getQuery(event).pageId)
    if (!Number.isInteger(pageId) || pageId <= 0) {
        throw createError({ statusCode: 400, message: 'pageId 為必填且必須是正整數' })
    }
    const page = await requirePageOwner(authUser.id, pageId)
    if (page.siteId !== site.id) throw createError({ statusCode: 403, message: 'page 不屬於此 site' })

    const { file } = await parseMultipartUpload(event)
    if (!file) {
        throw createError({ statusCode: 400, message: '找不到檔案欄位' })
    }

    try {
        const fileRecord = await prisma.$transaction(async (tx) => {
            const record = await saveUploadedFileToSite(site.id, authUser.id, file, 'editor', tx)
            await tx.pageFile.create({ data: { siteId: site.id, pageId, fileId: record.id, usage: 'editor' } })
            return record
        })
        const origin = getRequestURL(event).origin
        const fileUrl = `${origin}${getFileContentPath(fileRecord.id)}`

        return {
            url: fileUrl,
            default: fileUrl,
            id: fileRecord.id,
            name: fileRecord.name,
        }
    } finally {
        await discardStagedUpload(file)
    }
})
