import { createStoredFileStream, getAccessibleFileRecord, resolveStoredFilePath } from '../../../utils/file'
import { sendStream } from 'h3'

defineRouteMeta({
    openAPI: {
        tags: ['file'],
        summary: '下載檔案',
        description: '下載指定的檔案',
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

    const absolutePath = await resolveStoredFilePath(file.path)
    const encodedFileName = encodeURIComponent(file.name)

    event.res.setHeader('Content-Type', 'application/octet-stream')
    event.res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`)
    event.res.setHeader('X-Content-Type-Options', 'nosniff')
    event.res.setHeader('Cache-Control', 'private, no-store')
    return await sendStream(event, createStoredFileStream(absolutePath))
})
