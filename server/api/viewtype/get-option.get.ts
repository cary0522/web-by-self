import type { ViewType } from '~/types/view-type'

export default defineEventHandler(async () => {
    const res = await prisma.viewType.findMany()

    return res as ViewType[]
})