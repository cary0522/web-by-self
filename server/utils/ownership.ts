import { prisma } from './prisma'
import { normalizeSiteDomain } from './site-domain'

function notFound(resourceName: string): never {
    throw createError({
        statusCode: 404,
        message: `找不到${resourceName}`,
    })
}

function forbidden(): never {
    throw createError({
        statusCode: 403,
        message: '無權存取此資源',
    })
}

function assertOwner(createdById: number | null, userId: number): void {
    if (createdById !== userId) forbidden()
}

export async function requireSiteOwnerById(userId: number, siteId: number) {
    const site = await prisma.site.findUnique({
        where: { id: siteId },
    })

    if (!site) notFound('site')
    assertOwner(site.createdById, userId)
    return site
}

export async function requireSiteOwnerByDomain(userId: number, domain: string) {
    const site = await prisma.site.findUnique({
        where: { domain: normalizeSiteDomain(domain) },
    })

    if (!site) notFound('site')
    assertOwner(site.createdById, userId)
    return site
}

export async function requireSiteMenuOwner(userId: number, menuId: number) {
    const menu = await prisma.siteMenu.findUnique({
        where: { id: menuId },
        include: {
            site: {
                select: { createdById: true },
            },
        },
    })

    if (!menu) notFound('頁籤')
    assertOwner(menu.site.createdById, userId)
    return menu
}

export async function requireMenuInSite(menuId: number, siteId: number) {
    const menu = await prisma.siteMenu.findUnique({
        where: { id: menuId },
        select: { id: true, siteId: true },
    })

    if (!menu) notFound('父層頁籤')
    if (menu.siteId !== siteId) forbidden()
    return menu
}

export async function requirePageOwner(userId: number, pageId: number) {
    const page = await prisma.page.findUnique({
        where: { id: pageId },
        include: {
            site: {
                select: { createdById: true },
            },
        },
    })

    if (!page) notFound('page')
    assertOwner(page.site.createdById, userId)
    return page
}

export async function requireSectionOwner(userId: number, sectionId: number) {
    const section = await prisma.pageSection.findUnique({
        where: { id: sectionId },
        include: {
            page: {
                select: {
                    site: {
                        select: { id: true, createdById: true },
                    },
                },
            },
        },
    })

    if (!section) notFound('section')
    assertOwner(section.page.site.createdById, userId)
    return section
}

export async function requireFileInSite(fileId: number, siteId: number) {
    const file = await prisma.file.findUnique({
        where: { id: fileId, deletedAt: null },
    })

    if (!file) notFound('檔案')
    if (file.siteId !== siteId) forbidden()
    return file
}
