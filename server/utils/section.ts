import { prisma } from './prisma'
import { getPageId, type PageVisibility } from './page'
import { requireSectionOwner, requireSiteOwnerByDomain } from './ownership'
import type { Prisma } from '../../app/generated/prisma/client.js'
import { getCarouselFileIds, parsePageSectionCreate, parsePageSectionUpdate } from './page-section'

export async function getSectionByPageId(
    domain: string,
    slug: string,
    visibility: PageVisibility = 'admin',
) {
    if (!domain || !slug) {
        throw createError({
            statusCode: 400,
            message: 'Domain 與 slug 為必填',
        })
    }

    const pageId = await getPageId(domain, slug, visibility)
    if (!pageId) {
        throw createError({
            statusCode: 404,
            message: '沒有此 page',
        })
    }

    const sections = await prisma.pageSection.findMany({
        where: {
            pageId: pageId,
            isEnabled: visibility === 'public' ? true : undefined,
        },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    })
    return sections
}

async function assertSectionFilesInSite(fileIds: number[], siteId: number, tx: Prisma.TransactionClient): Promise<void> {
    if (fileIds.length === 0) return
    const count = await tx.file.count({
        where: { id: { in: fileIds }, siteId, deletedAt: null },
    })
    if (count !== fileIds.length) {
        throw createError({ statusCode: 400, message: '區塊引用了不存在或其他網站的檔案' })
    }
}

export async function insertSection(domain: string, slug: string, value: unknown, userId: number) {
    if (!domain || !slug) {
        throw createError({
            statusCode: 400,
            message: 'Domain 與 slug 為必填',
        })
    }

    const site = await requireSiteOwnerByDomain(userId, domain)
    const insertData = parsePageSectionCreate(value)
    const pageId = await getPageId(domain, slug)
    if (!pageId) {
        throw createError({
            statusCode: 404,
            message: '沒有此 page',
        })
    }

    const fileIds = getCarouselFileIds(insertData.type, insertData.bodyJson)
    return prisma.$transaction(async (tx) => {
        await assertSectionFilesInSite(fileIds, site.id, tx)
        const section = await tx.pageSection.create({
            data: { pageId, ...insertData },
        })
        if (fileIds.length > 0) {
            await tx.pageFile.createMany({
                data: fileIds.map(fileId => ({ siteId: site.id, pageId, fileId, sectionId: section.id, usage: 'section' })),
                skipDuplicates: true,
            })
        }
        return section
    })
}

export async function updateSection(sectionId: number, value: unknown, userId: number) {
    if (!sectionId) {
        throw createError({
            statusCode: 400,
            message: 'Section ID 為必填',
        })
    }

    const existing = await requireSectionOwner(userId, sectionId)
    const updateData = parsePageSectionUpdate(value, existing.type)
    const nextBodyJson = updateData.bodyJson ?? existing.bodyJson
    const fileIds = getCarouselFileIds(existing.type, nextBodyJson)

    return prisma.$transaction(async (tx) => {
        await assertSectionFilesInSite(fileIds, existing.page.site.id, tx)
        const section = await tx.pageSection.update({
            where: { id: sectionId },
            data: updateData,
        })
        await tx.pageFile.deleteMany({ where: { sectionId, usage: 'section' } })
        if (fileIds.length > 0) {
            await tx.pageFile.createMany({
                data: fileIds.map(fileId => ({ siteId: existing.page.site.id, pageId: existing.pageId, fileId, sectionId, usage: 'section' })),
                skipDuplicates: true,
            })
        }
        return section
    })
}

export async function deleteSection(sectionId: number, userId: number) {
    if (!sectionId) {
        throw createError({
            statusCode: 400,
            message: 'Section ID 為必填',
        })
    }

    await requireSectionOwner(userId, sectionId)
    return prisma.pageSection.delete({
        where: { id: sectionId },
    })
}
