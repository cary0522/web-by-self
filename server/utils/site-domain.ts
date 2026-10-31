/**
 * Site domains are persisted as route prefixes with exactly one leading slash.
 */
export function normalizeSiteDomain(domain: string): string {
    const routeDomain = domain.trim().replace(/^\/+/, '')
    return routeDomain ? `/${routeDomain}` : ''
}

const SITE_NAME_MAX_LENGTH = 200
const SITE_DOMAIN_MAX_LENGTH = 255
const SITE_DOMAIN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

function badRequest(message: string): never {
    throw createError({ statusCode: 400, message })
}

function parseSiteName(value: unknown): string {
    if (typeof value !== 'string') badRequest('網站名稱格式錯誤')

    const name = value.trim()
    if (!name) badRequest('網站名稱為必填')
    if ([...name].length > SITE_NAME_MAX_LENGTH) {
        badRequest(`網站名稱不可超過 ${SITE_NAME_MAX_LENGTH} 個字元`)
    }
    return name
}

function parseSiteDomain(value: unknown): string {
    if (typeof value !== 'string') badRequest('網站 Domain 格式錯誤')
    if (!value.trim()) badRequest('網站 Domain 為必填')
    if (/\s/.test(value)) badRequest('網站 Domain 不可包含空白')

    const domain = normalizeSiteDomain(value)
    const routeSegment = domain.slice(1)
    if (!SITE_DOMAIN_PATTERN.test(routeSegment)) {
        badRequest('網站 Domain 僅可包含英文字母、數字、連字號與底線，且不可包含路徑、query 或 hash')
    }
    if (domain.length > SITE_DOMAIN_MAX_LENGTH) {
        badRequest(`網站 Domain 不可超過 ${SITE_DOMAIN_MAX_LENGTH - 1} 個字元`)
    }
    return domain
}

export function parseSiteFields(body: unknown): { name: string, domain: string } {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        badRequest('Request body 格式錯誤')
    }

    const fields = body as Record<string, unknown>
    return {
        name: parseSiteName(fields.name),
        domain: parseSiteDomain(fields.domain),
    }
}

export function handleSiteWriteError(error: unknown): never {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw createError({
            statusCode: 409,
            message: '網站 Domain 已被使用',
        })
    }
    throw error
}
