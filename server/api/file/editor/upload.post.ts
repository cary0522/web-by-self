import { requireAuth } from '../../../utils/auth'
import { getSiteByDomain } from '../../../utils/site'
import { saveUploadedFileToSite } from '../../../utils/file'

defineRouteMeta({
    openAPI: {
        tags: ['file'],
        summary: 'CKEditor 圖片上傳',
        description: '提供 CKEditor simpleUpload 使用，將圖片儲存為 site 檔案',
    },
})

export default defineEventHandler(async (event) => {
    const authUser = requireAuth(event)
    const domain = String(getQuery(event).domain || '')
    if (!domain) {
        throw createError({ statusCode: 400, message: 'domain 為必填' })
    }

    const site = await getSiteByDomain(domain)
    if (!site) {
        throw createError({ statusCode: 404, message: '找不到 site' })
    }

    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
        throw createError({ statusCode: 400, message: '請上傳檔案' })
    }

    const filePart = formData.find(part => part.filename)
    if (!filePart) {
        throw createError({ statusCode: 400, message: '找不到檔案欄位' })
    }

    const fileRecord = await saveUploadedFileToSite(site.id, authUser.id, filePart, 'file')
    const origin = getRequestURL(event).origin
    const fileUrl = `${origin}${fileRecord.path}`

    return {
        url: fileUrl,
        default: fileUrl,
        id: fileRecord.id,
        name: fileRecord.name,
    }
})
