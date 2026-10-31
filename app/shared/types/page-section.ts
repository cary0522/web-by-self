export type PageSectionType =
    | 'richText'
    | 'table'
    | 'carousel'
    | 'announcement'

// 文字區塊
export interface RichTextBody {
    contentHtml: string
    textAlign: 'left' | 'center' | 'right'
    maxWidth: string
}

// 表格欄位
export interface TableColumn {
    key: string
    label: string
}

// 表格列
export interface TableRow {
    [key: string]: string | number | boolean | null
}

// 表格內容
export interface TableBody {
    columns: TableColumn[]
    rows: TableRow[]
    striped: boolean
    bordered: boolean
}

// 輪播圖設定
export interface CarouselBody {
    images: Array<{
        fileId: number
        alt?: string
        caption?: string
        linkUrl?: string
    }>
    autoplay: boolean
    interval: number
    showArrows: boolean
    showDots: boolean
}

// 公告表格設定
export interface AnnouncementBody {
    limit: number
    showDate: boolean
    showMoreButton: boolean
}

export type PageSectionBodyMap = {
    richText: RichTextBody
    table: TableBody
    carousel: CarouselBody
    announcement: AnnouncementBody
}

export type PageSection<T extends PageSectionType = PageSectionType> = {
    id: number
    pageId: number
    type: T
    title: string | null
    bodyJson: PageSectionBodyMap[T]
    sortOrder: number
    isEnabled: boolean
    createdAt?: string
    updatedAt?: string
}

export type CreatePageSectionPayload<T extends PageSectionType = PageSectionType> = Pick<
    PageSection<T>,
    'type' | 'title' | 'bodyJson' | 'sortOrder' | 'isEnabled'
>

export type UpdatePageSectionPayload<T extends PageSectionType = PageSectionType> = Omit<
    CreatePageSectionPayload<T>,
    'type'
>
