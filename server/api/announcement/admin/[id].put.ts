import { requireAdmin } from '../../../utils/auth'
import { parseAnnouncementBody } from '../../../utils/announcement'
import { requireSiteOwnerById } from '../../../utils/ownership'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: '公告 ID 格式錯誤' })
    const announcement = await prisma.announcement.findUnique({ where: { id, deletedAt: null } })
    if (!announcement) throw createError({ statusCode: 404, message: '找不到公告' })
    await requireSiteOwnerById(authUser.id, announcement.siteId)
    const data = parseAnnouncementBody(await readBody<unknown>(event), true)
    const publishedAt = data.publishedAt ?? announcement.publishedAt
    const expiresAt = data.expiresAt === undefined ? announcement.expiresAt : data.expiresAt
    if (expiresAt && expiresAt <= publishedAt) throw createError({ statusCode: 400, message: 'expiresAt 必須晚於 publishedAt' })
    return prisma.announcement.update({
        where: { id },
        data: { ...data, updatedBy: authUser.id },
    })
})
