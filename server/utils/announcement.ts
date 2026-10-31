const MAX_CONTENT_BYTES = 16_777_215

function badRequest(message: string): never {
    throw createError({ statusCode: 400, message })
}

export function parseAnnouncementBody(value: unknown, partial = false) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) badRequest('Request body 格式錯誤')
    const body = value as Record<string, unknown>
    const allowed = new Set(['title', 'content', 'isEnabled', 'publishedAt', 'expiresAt'])
    const unknown = Object.keys(body).find(key => !allowed.has(key))
    if (unknown) badRequest(`不允許的公告欄位：${unknown}`)

    const result: {
        title?: string
        content?: string | null
        isEnabled?: boolean
        publishedAt?: Date
        expiresAt?: Date | null
    } = {}
    if (!partial || body.title !== undefined) {
        if (typeof body.title !== 'string' || !body.title.trim() || [...body.title.trim()].length > 200) {
            badRequest('公告標題為必填且不可超過 200 個字元')
        }
        result.title = body.title.trim()
    }
    if (body.content !== undefined) {
        if (body.content !== null && (typeof body.content !== 'string' || Buffer.byteLength(body.content, 'utf8') > MAX_CONTENT_BYTES)) {
            badRequest('公告內容格式錯誤或超過資料庫限制')
        }
        result.content = body.content as string | null
    }
    if (body.isEnabled !== undefined) {
        if (typeof body.isEnabled !== 'boolean') badRequest('公告啟用狀態格式錯誤')
        result.isEnabled = body.isEnabled
    } else if (!partial) result.isEnabled = true

    for (const field of ['publishedAt', 'expiresAt'] as const) {
        if (body[field] === undefined) continue
        if (field === 'expiresAt' && (body[field] === null || body[field] === '')) {
            result.expiresAt = null
            continue
        }
        const date = new Date(String(body[field]))
        if (Number.isNaN(date.getTime())) badRequest(`${field} 格式錯誤`)
        result[field] = date
    }
    if (!partial && !result.publishedAt) result.publishedAt = new Date()
    if (result.expiresAt && result.publishedAt && result.expiresAt <= result.publishedAt) {
        badRequest('expiresAt 必須晚於 publishedAt')
    }
    if (Object.keys(result).length === 0) badRequest('至少提供一個公告欄位')
    return result
}
