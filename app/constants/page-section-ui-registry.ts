import {
    createDefaultAnnouncementBody,
    createDefaultCarouselBody,
    createDefaultRichTextBody,
    createDefaultTableBody,
} from '../shared/constants/page-section-defaults'

export const pageSectionRegistry = {
    richText: {
        label: '文字區塊',
        createDefaultBody: createDefaultRichTextBody,
    },

    table: {
        label: '表格',
        createDefaultBody: createDefaultTableBody,
    },

    carousel: {
        label: '輪播圖',
        createDefaultBody: createDefaultCarouselBody,
    },

    announcement: {
        label: '公告',
        createDefaultBody: createDefaultAnnouncementBody,
    },
} as const