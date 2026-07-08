import { prisma } from './prisma'

export async function requiresPageForViewType(viewTypeId: number) {
  const viewType = await prisma.viewType.findUnique({
    where: {
      id: viewTypeId,
    },
    select: {
      name: true,
    },
  })

  const viewTypeName = viewType?.name?.toLowerCase()
  return viewTypeName === 'page' || viewTypeName === 'pdf'
}

export async function isHomeViewType(viewTypeId: number) {
  const viewType = await prisma.viewType.findUnique({
    where: {
      id: viewTypeId,
    },
    select: {
      name: true,
    },
  })

  return viewType?.name?.toLowerCase() === 'home'
}
