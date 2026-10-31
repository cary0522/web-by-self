import { requireAdmin } from '../../../utils/auth'
import { requireSiteOwnerById } from '../../../utils/ownership'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: 'file id 格式錯誤' })

    const file = await prisma.file.findUnique({ where: { id } })
    if (!file || !file.deletedAt) throw createError({ statusCode: 404, message: '找不到已刪除的檔案' })
    await requireSiteOwnerById(authUser.id, file.siteId)

    // Restored files remain private until an owner explicitly publishes or references them.
    return prisma.file.update({
        where: { id },
        data: { deletedAt: null, deletedBy: null, isPublic: false },
    })
})
