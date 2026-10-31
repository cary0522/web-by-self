import type { Prisma } from '../../app/generated/prisma/client.js'
import type { PageSectionType } from '../../app/shared/types/page-section'

const SECTION_TYPES = new Set<PageSectionType>(['richText', 'table', 'carousel', 'announcement'])
const TOP_LEVEL_FIELDS = new Set(['type', 'title', 'bodyJson', 'sortOrder', 'isEnabled'])
const MAX_TITLE_LENGTH = 200
const MAX_RICH_TEXT_BYTES = 1_048_576
const MAX_TABLE_COLUMNS = 100
const MAX_TABLE_ROWS = 1_000
const MAX_CAROUSEL_IMAGES = 50

function badRequest(message: string): never {
    throw createError({ statusCode: 400, message })
}

function objectValue(value: unknown, field: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) badRequest(`${field} 格式錯誤`)
    return value as Record<string, unknown>
}

function assertAllowedFields(body: Record<string, unknown>): void {
    const unknownField = Object.keys(body).find(field => !TOP_LEVEL_FIELDS.has(field))
    if (unknownField) badRequest(`不允許的區塊欄位：${unknownField}`)
}

function parseTitle(value: unknown): string | null {
    if (value === undefined || value === null || value === '') return null
    if (typeof value !== 'string') badRequest('title 格式錯誤')
    const title = value.trim()
    if ([...title].length > MAX_TITLE_LENGTH) badRequest(`title 不可超過 ${MAX_TITLE_LENGTH} 個字元`)
    return title || null
}

function parseSortOrder(value: unknown): number {
    if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 2_147_483_647) {
        badRequest('sortOrder 必須是非負整數')
    }
    return value as number
}

function parseBoolean(value: unknown, field: string): boolean {
    if (typeof value !== 'boolean') badRequest(`${field} 格式錯誤`)
    return value
}

function parseOptionalString(value: unknown, field: string, maxLength = 500): string | undefined {
    if (value === undefined || value === null || value === '') return undefined
    if (typeof value !== 'string' || [...value].length > maxLength) badRequest(`${field} 格式錯誤`)
    return value
}

function parseBody(type: PageSectionType, value: unknown): Prisma.InputJsonValue {
    const body = objectValue(value, 'bodyJson')

    if (type === 'richText') {
        if (typeof body.contentHtml !== 'string' || Buffer.byteLength(body.contentHtml, 'utf8') > MAX_RICH_TEXT_BYTES) {
            badRequest('richText.contentHtml 格式錯誤或超過 1 MiB')
        }
        if (!['left', 'center', 'right'].includes(String(body.textAlign))) badRequest('richText.textAlign 格式錯誤')
        if (typeof body.maxWidth !== 'string' || body.maxWidth.length > 50) badRequest('richText.maxWidth 格式錯誤')
    } else if (type === 'table') {
        if (!Array.isArray(body.columns) || body.columns.length > MAX_TABLE_COLUMNS) badRequest('table.columns 格式錯誤')
        const keys = new Set<string>()
        for (const item of body.columns) {
            const column = objectValue(item, 'table column')
            if (typeof column.key !== 'string' || !column.key || column.key.length > 100
                || typeof column.label !== 'string' || column.label.length > 200 || keys.has(column.key)) {
                badRequest('table.columns 含有無效或重複欄位')
            }
            keys.add(column.key)
        }
        if (!Array.isArray(body.rows) || body.rows.length > MAX_TABLE_ROWS) badRequest('table.rows 格式錯誤')
        for (const rowValue of body.rows) {
            const row = objectValue(rowValue, 'table row')
            for (const [key, cell] of Object.entries(row)) {
                if (!keys.has(key) || !['string', 'number', 'boolean'].includes(typeof cell) && cell !== null) {
                    badRequest('table.rows 含有無效欄位或內容')
                }
            }
        }
        parseBoolean(body.striped, 'table.striped')
        parseBoolean(body.bordered, 'table.bordered')
    } else if (type === 'carousel') {
        if (!Array.isArray(body.images) || body.images.length > MAX_CAROUSEL_IMAGES) badRequest('carousel.images 格式錯誤')
        const fileIds = new Set<number>()
        for (const imageValue of body.images) {
            const image = objectValue(imageValue, 'carousel image')
            if (!Number.isInteger(image.fileId) || (image.fileId as number) <= 0 || fileIds.has(image.fileId as number)) {
                badRequest('carousel.images 含有無效或重複 fileId')
            }
            fileIds.add(image.fileId as number)
            parseOptionalString(image.alt, 'carousel image alt', 300)
            parseOptionalString(image.caption, 'carousel image caption', 500)
            const linkUrl = parseOptionalString(image.linkUrl, 'carousel image linkUrl')
            if (linkUrl) {
                let parsed: URL
                try { parsed = new URL(linkUrl) } catch { badRequest('carousel image linkUrl 格式錯誤') }
                if (!['http:', 'https:'].includes(parsed.protocol)) badRequest('carousel image linkUrl 僅允許 http 或 https')
            }
        }
        parseBoolean(body.autoplay, 'carousel.autoplay')
        if (!Number.isInteger(body.interval) || (body.interval as number) < 1_000 || (body.interval as number) > 60_000) {
            badRequest('carousel.interval 必須介於 1000 至 60000')
        }
        parseBoolean(body.showArrows, 'carousel.showArrows')
        parseBoolean(body.showDots, 'carousel.showDots')
    } else {
        if (!Number.isInteger(body.limit) || (body.limit as number) < 1 || (body.limit as number) > 100) {
            badRequest('announcement.limit 必須介於 1 至 100')
        }
        parseBoolean(body.showDate, 'announcement.showDate')
        parseBoolean(body.showMoreButton, 'announcement.showMoreButton')
    }

    return body as Prisma.InputJsonValue
}

function parseType(value: unknown): PageSectionType {
    if (typeof value !== 'string' || !SECTION_TYPES.has(value as PageSectionType)) badRequest('不支援的區塊 type')
    return value as PageSectionType
}

export function parsePageSectionCreate(value: unknown) {
    const body = objectValue(value, 'Request body')
    assertAllowedFields(body)
    const type = parseType(body.type)
    return {
        type,
        title: parseTitle(body.title),
        bodyJson: parseBody(type, body.bodyJson),
        sortOrder: parseSortOrder(body.sortOrder ?? 0),
        isEnabled: body.isEnabled === undefined ? true : parseBoolean(body.isEnabled, 'isEnabled'),
    }
}

export function parsePageSectionUpdate(value: unknown, currentType: string) {
    const body = objectValue(value, 'Request body')
    assertAllowedFields(body)
    const type = parseType(currentType)
    if (body.type !== undefined && body.type !== type) badRequest('區塊建立後不可變更 type')
    if (Object.keys(body).length === 0) badRequest('至少提供一個更新欄位')

    return {
        title: body.title === undefined ? undefined : parseTitle(body.title),
        bodyJson: body.bodyJson === undefined ? undefined : parseBody(type, body.bodyJson),
        sortOrder: body.sortOrder === undefined ? undefined : parseSortOrder(body.sortOrder),
        isEnabled: body.isEnabled === undefined ? undefined : parseBoolean(body.isEnabled, 'isEnabled'),
    }
}

export function getCarouselFileIds(type: string, bodyJson: unknown): number[] {
    if (type !== 'carousel') return []
    const body = bodyJson as { images?: Array<{ fileId?: unknown }> }
    return body.images?.map(image => image.fileId).filter((id): id is number => Number.isInteger(id)) ?? []
}
