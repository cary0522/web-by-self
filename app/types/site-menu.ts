export interface SiteMenu {
  id: number,
  name: string,
  slug: string,
  viewTypeId: number,
  parentId?: number | null,
  subPage: SiteMenu[]
}