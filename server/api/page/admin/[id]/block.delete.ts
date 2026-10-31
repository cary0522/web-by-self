import { deleteSection } from '../../../../utils/section'
import { requireAdmin } from '../../../../utils/auth'

defineRouteMeta({
    openAPI: {
        tags: ['page'],
        summary: '刪除頁面block內容',
        description: '刪除頁面block內容',
        parameters: [
            {
                in: 'path',
                name: 'id',
                required: true,
            },
        ],
    },
})

// /api/page/:id/block 刪除頁面block內容
export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)

    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
        throw createError({ statusCode: 400, message: 'Section ID 格式錯誤' })
    }

    const section = await deleteSection(id, authUser.id)

    return section
})
