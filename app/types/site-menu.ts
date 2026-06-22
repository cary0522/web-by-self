export interface SiteMenu {
  id: number,
  name: string,
  slug: string,
  viewTypeId: number,
  pageId?: number | null,
  parentId?: number | null,
  subPage: SiteMenu[]
}