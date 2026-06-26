import type { ViewType } from '~/types/view-type'

defineRouteMeta({
    openAPI: {
        tags: ['viewType'],
        summary: '取得所有的viewType選項',
        description: '可以做為前端建立頁面時的選項',
    },
})

export default defineEventHandler(async () => {
    const res = await prisma.viewType.findMany()

    return res as ViewType[]
})