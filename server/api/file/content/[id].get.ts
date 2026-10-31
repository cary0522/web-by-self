import {
    createStoredFileStream,
    getFileContentType,
    getFilePreviewType,
    getAccessibleFileRecord,
    resolveStoredFilePath,
} from '../../../utils/file'
import { sendStream } from 'h3'

defineRouteMeta({
    openAPI: {
        tags: ['file'],
        summary: '安全預覽檔案內容',
        description: '僅以内嵌方式輸出通過驗證的點陣圖片或 PDF，不輸出 SVG',
        parameters: [
            {
                in: 'path',
                name: 'id',
                required: true,
            },
        ],
    },
})

export default defineEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    if (Number.isNaN(id) || id <= 0) {
        throw createError({ statusCode: 400, message: 'file id 格式錯誤' })
    }

    const file = await getAccessibleFileRecord(event, id)
    if (!file) {
        throw createError({ statusCode: 404, message: '找不到檔案' })
    }

    if (!getFilePreviewType(file.path)) {
        throw createError({ statusCode: 415, message: '此檔案不允許公開預覽，請使用下載端點' })
    }

    const absolutePath = await resolveStoredFilePath(file.path)
    const encodedFileName = encodeURIComponent(file.name)

    event.res.setHeader('Content-Type', getFileContentType(file.path))
    event.res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodedFileName}`)
    event.res.setHeader('X-Content-Type-Options', 'nosniff')
    event.res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'")
    event.res.setHeader('Cache-Control', 'public, max-age=3600')
    return await sendStream(event, createStoredFileStream(absolutePath))
})
