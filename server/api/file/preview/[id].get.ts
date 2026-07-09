import { getFileRecord, getFilePreviewType } from '../../../utils/file'

defineRouteMeta({
    openAPI: {
        tags: ['file'],
        summary: '取得檔案預覽資訊',
        description: '取得檔案的預覽資訊，包括是否可預覽、預覽類型及預覽 URL',
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

    const file = await getFileRecord(id)
    if (!file) {
        throw createError({ statusCode: 404, message: '找不到檔案' })
    }

    const previewType = getFilePreviewType(file.path)
    const origin = getRequestURL(event).origin

    return {
        id: file.id,
        name: file.name,
        path: file.path,
        previewable: previewType !== null,
        previewType,
        previewUrl: previewType ? `${origin}${file.path}` : null,
        downloadUrl: `${origin}/api/file/download/${file.id}`,
    }
})
