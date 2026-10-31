export interface SiteMenu {
  id: number,
  name: string,
  slug: string | null,
  viewTypeId: number,
  viewType?: string,
  sortOrder: number,
  isEnabled: boolean,
  pageId?: number | null,
  parentId?: number | null,
  icon?: string | null,
  url?: string | null,
  target?: '_self' | '_blank' | null,
  subPage: SiteMenu[]
}
