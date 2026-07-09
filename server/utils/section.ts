import { prisma } from './prisma'
import { getPageId } from './page'

export async function getSectionByPageId(domain: string, slug: string, inEnabled: boolean | null = null) {
    if (!domain || !slug) {
        throw createError({
            statusCode: 400,
            message: 'Domain 與 slug 為必填',
        })
    }

    const pageId = await getPageId(domain, slug)
    if (!pageId) {
        throw createError({
            statusCode: 404,
            message: '沒有此 page',
        })
    }

    const sections = await prisma.pageSection.findMany({
        where: {
            pageId: pageId,
            isEnabled: inEnabled ?? undefined,
        },
        orderBy: {
            sortOrder: 'asc',
        },
    })
    return sections
}