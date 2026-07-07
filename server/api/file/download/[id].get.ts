import { getFileRecord } from '../../../utils/file'
import { join } from 'node:path'
import { access } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
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
        throw createError({ statusCode: 400, statusMessage: 'file id 格式錯誤' })
    }

    const file = await getFileRecord(id)
    if (!file) {
        throw createError({ statusCode: 404, statusMessage: '找不到檔案' })
    }

    const safeRelativePath = file.path.replace(/^\//, '')
    const absolutePath = join(process.cwd(), 'public', safeRelativePath)
    try {
        await access(absolutePath)
    } catch {
        throw createError({ statusCode: 404, statusMessage: '實體檔案不存在' })
    }

    event.res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`)
    return await sendStream(event, createReadStream(absolutePath))
})
