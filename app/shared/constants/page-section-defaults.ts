import type {
    AnnouncementBody,
    CarouselBody,
    RichTextBody,
    TableBody,
} from '~/shared/types/page-section'

// 建立預設文字區塊內容
export const createDefaultRichTextBody = (): RichTextBody => ({
    contentHtml: '<p>請輸入文字內容</p>',
    textAlign: 'left',
    maxWidth: '960px',
})

// 建立預設表格區塊內容
export const createDefaultTableBody = (): TableBody => ({
    columns: [
        {
            key: 'column1',
            label: '欄位一',
        },
        {
            key: 'column2',
            label: '欄位二',
        },
    ],
    rows: [
        {
            column1: '',
            column2: '',
        },
    ],
    striped: true,
    bordered: true,
})

// 建立預設輪播圖區塊設定
export const createDefaultCarouselBody = (): CarouselBody => ({
    images: [],
    autoplay: true,
    interval: 5000,
    showArrows: true,
    showDots: true,
})

// 建立預設公告設定
export const createDefaultAnnouncementBody = (): AnnouncementBody => ({
    limit: 5,
    showDate: true,
    showMoreButton: true,
})
