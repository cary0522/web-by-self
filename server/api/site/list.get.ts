import { requireAdmin } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    return prisma.site.findMany({
        where: { createdById: authUser.id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { id: true, name: true, domain: true, createdAt: true, updatedAt: true },
    })
})
