import type { ViewType } from '~/shared/types/view-type'
import { requireAdmin } from '../../utils/auth'

defineRouteMeta({
    openAPI: {
        tags: ['viewType'],
        summary: '取得所有的viewType選項',
        description: '可以做為前端建立頁面時的選項',
    },
})

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const res = await prisma.viewType.findMany({
        where: { name: { in: ['home', 'page', 'pdf', 'parent', 'external'] } },
        orderBy: { id: 'asc' },
    })

    return res as ViewType[]
})
