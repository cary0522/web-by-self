export interface SiteMenu {
  id: number,
  name: string,
  slug: string,
  viewTypeId: number,
  viewType?: string,
  pageId?: number | null,
  parentId?: number | null,
  subPage: SiteMenu[]
}