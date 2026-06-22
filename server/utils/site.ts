import { prisma } from './prisma'

export async function getSiteByDomain(domain: string) {
  return prisma.site.findFirst({
    where: {
      domain: '/' + domain,
    },
  })
}

export async function getSiteByCreatedById(createdById: number) {
  return prisma.site.findFirst({
    where: {
      createdById,
    },
  })
}

export async function getSiteMenusBySiteId(siteId: number) {
  return prisma.siteMenu.findMany({
    where: {
      siteId,
      isDeleted: false,
    },
    orderBy: {
      sortOrder: 'asc',
    },
    select: {
      id: true,
      name: true,
      slug: true,
      viewTypeRelation: {
        select: {
          id: true,
        },
      },
      parentId: true,
    },
  })
}
