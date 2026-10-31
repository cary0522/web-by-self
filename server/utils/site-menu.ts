import type { Prisma } from '../../app/generated/prisma/client.js'

const SITE_MENU_TEXT_MAX_LENGTH = 200
const SITE_MENU_ICON_MAX_LENGTH = 100
const SITE_MENU_URL_MAX_LENGTH = 500
const MEDIUM_TEXT_MAX_BYTES = 16_777_215
const MYSQL_INT_MAX = 2_147_483_647
const ROUTED_VIEW_TYPES = new Set(['home', 'page', 'pdf'])
const SUPPORTED_VIEW_TYPES = new Set([...ROUTED_VIEW_TYPES, 'parent', 'external'])
const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

type SiteMenuHierarchyNode = {
    id: number
    parentId: number | null
}

type SiteMenuViewTypeNode = {
    id: number
    viewTypeRelation: { name: string } | null
}

type SiteMenuTreeSource = {
    id: number
    name: string
    slug: string | null
    pageId: number | null
    sortOrder: number
    isEnabled: boolean
    parentId: number | null
    icon: string | null
    url: string | null
    target: string | null
    viewTypeRelation: {
        id: number
        name: string
    } | null
}

export type SiteMenuTreeNode = {
    id: number
    name: string
    slug: string | null
    pageId: number | null
    sortOrder: number
    isEnabled: boolean
    parentId: number | null
    icon: string | null
    url: string | null
    target: string | null
    viewTypeId: number
    viewType?: string
    subPage: SiteMenuTreeNode[]
}

function badRequest(message: string): never {
    throw createError({ statusCode: 400, message })
}

export function requireObjectBody(body: unknown): Record<string, unknown> {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        badRequest('Request body 格式錯誤')
    }
    return body as Record<string, unknown>
}

export async function lockSiteMenuHierarchy(
    client: Pick<Prisma.TransactionClient, '$queryRaw'>,
    siteId: number,
): Promise<void> {
    // Always lock the site first. Locking SiteMenus alone would not serialize two
    // creates when the site has no menus yet.
    await client.$queryRaw<Array<{ id: number }>>`
        SELECT id
        FROM Sites
        WHERE id = ${siteId}
        FOR UPDATE
    `

    // Also lock the current hierarchy so re-parent operations cannot validate
    // stale data and commit a cycle.
    await client.$queryRaw<Array<{ id: number }>>`
        SELECT id
        FROM SiteMenus
        WHERE siteId = ${siteId} AND isDeleted = false
        ORDER BY id
        FOR UPDATE
    `
}

function requiredText(value: unknown, fieldName: string): string {
    if (typeof value !== 'string') badRequest(`${fieldName}格式錯誤`)

    const text = value.trim()
    if (!text) badRequest(`${fieldName}為必填`)
    if ([...text].length > SITE_MENU_TEXT_MAX_LENGTH) {
        badRequest(`${fieldName}不可超過 ${SITE_MENU_TEXT_MAX_LENGTH} 個字元`)
    }
    return text
}

function optionalText(value: unknown, fieldName: string, maxLength: number): string | null {
    if (value === undefined || value === null || value === '') return null
    if (typeof value !== 'string') badRequest(`${fieldName}格式錯誤`)
    const normalized = value.trim()
    if (!normalized) return null
    if ([...normalized].length > maxLength) badRequest(`${fieldName}不可超過 ${maxLength} 個字元`)
    return normalized
}

export function normalizeSiteMenuSlug(value: unknown): string {
    const rawSlug = requiredText(value, '頁籤 slug')
    const segment = rawSlug.replace(/^\/+/, '')
    if (!segment || !/^[\p{L}\p{N}_-]+$/u.test(segment)) {
        badRequest('頁籤 slug 僅允許文字、數字、連字號與底線，且必須是單一路徑')
    }
    return `/${segment}`
}

export function parseSiteMenuDestination(body: Record<string, unknown>, viewTypeName: string) {
    const viewType = viewTypeName.trim().toLowerCase()
    if (!SUPPORTED_VIEW_TYPES.has(viewType)) badRequest('不支援的 viewType')

    if (ROUTED_VIEW_TYPES.has(viewType)) {
        return {
            slug: normalizeSiteMenuSlug(body.slug),
            activeSlug: normalizeSiteMenuSlug(body.slug),
            url: null,
            target: null,
        }
    }

    if (viewType === 'parent') {
        return { slug: null, activeSlug: null, url: null, target: null }
    }

    const url = optionalText(body.url, '外部連結', SITE_MENU_URL_MAX_LENGTH)
    if (!url) badRequest('外部連結為必填')

    let parsedUrl: URL
    try {
        parsedUrl = new URL(url)
    } catch {
        badRequest('外部連結格式錯誤')
    }
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsedUrl.protocol)) {
        badRequest('外部連結僅允許 http、https、mailto 或 tel')
    }

    const target = body.target === undefined || body.target === null || body.target === ''
        ? '_self'
        : body.target
    if (target !== '_self' && target !== '_blank') badRequest('連結開啟方式僅可為 _self 或 _blank')

    return { slug: null, activeSlug: null, url, target }
}

export function parseSiteMenuFields(body: Record<string, unknown>) {
    const viewTypeId = body.viewTypeId
    if (typeof viewTypeId !== 'number' || !Number.isInteger(viewTypeId) || viewTypeId <= 0) {
        badRequest('viewType ID 格式錯誤')
    }

    const sortOrder = body.sortOrder ?? 0
    if (typeof sortOrder !== 'number'
        || !Number.isInteger(sortOrder)
        || sortOrder < 0
        || sortOrder > MYSQL_INT_MAX) {
        badRequest('排序格式錯誤')
    }

    const content = body.content
    if (content !== undefined && content !== null && typeof content !== 'string') {
        badRequest('內容格式錯誤')
    }
    if (typeof content === 'string' && Buffer.byteLength(content, 'utf8') > MEDIUM_TEXT_MAX_BYTES) {
        badRequest('內容長度超過資料庫限制')
    }

    const isEnabled = body.isEnabled
    if (isEnabled !== undefined && typeof isEnabled !== 'boolean') badRequest('啟用狀態格式錯誤')

    return {
        name: requiredText(body.name, '頁籤名稱'),
        viewTypeId,
        sortOrder,
        isEnabled,
        icon: optionalText(body.icon, '頁籤圖示', SITE_MENU_ICON_MAX_LENGTH),
        content: content ?? null,
        hasContent: content !== undefined,
    }
}

export function assertHomeMenuAvailable(
    menus: SiteMenuViewTypeNode[],
    viewTypeName: string,
    currentMenuId?: number,
): void {
    if (viewTypeName.toLowerCase() !== 'home') return

    const existingHome = menus.some(menu => (
        menu.id !== currentMenuId
        && menu.viewTypeRelation?.name.toLowerCase() === 'home'
    ))
    if (existingHome) {
        throw createError({ statusCode: 409, message: '此網站已存在首頁頁籤' })
    }
}

export function isUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object'
        && error !== null
        && 'code' in error
        && error.code === 'P2002'
}

export function assertValidMenuParent(
    menus: SiteMenuHierarchyNode[],
    parentId: number | null,
    menuId?: number,
): void {
    if (parentId === null) return

    const menuById = new Map(menus.map(menu => [menu.id, menu]))
    if (!menuById.has(parentId)) badRequest('父層頁籤不存在或已刪除')

    const visited = new Set<number>()
    let ancestorId: number | null = parentId

    while (ancestorId !== null) {
        if (ancestorId === menuId) badRequest('父層頁籤不可為目前頁籤的子孫')
        if (visited.has(ancestorId)) badRequest('頁籤階層資料已存在循環')
        visited.add(ancestorId)

        const ancestor = menuById.get(ancestorId)
        if (!ancestor) badRequest('父層頁籤的階層資料不完整')
        ancestorId = ancestor.parentId
    }
}

export function getMenuSubtreeIds(menus: SiteMenuHierarchyNode[], rootId: number): number[] {
    const childrenByParentId = new Map<number, number[]>()
    for (const menu of menus) {
        if (menu.parentId === null) continue
        const children = childrenByParentId.get(menu.parentId) ?? []
        children.push(menu.id)
        childrenByParentId.set(menu.parentId, children)
    }

    const subtreeIds: number[] = []
    const pendingIds = [rootId]
    const visited = new Set<number>()

    while (pendingIds.length > 0) {
        const id = pendingIds.shift()!
        if (visited.has(id)) continue
        visited.add(id)
        subtreeIds.push(id)
        pendingIds.push(...(childrenByParentId.get(id) ?? []))
    }

    return subtreeIds
}

export function buildSiteMenuTree(menus: readonly SiteMenuTreeSource[]): SiteMenuTreeNode[] {
    const menuIds = new Set(menus.map(menu => menu.id))
    const childrenByParentId = new Map<number, SiteMenuTreeSource[]>()
    const rootMenus: SiteMenuTreeSource[] = []

    for (const menu of menus) {
        if (menu.parentId === null || !menuIds.has(menu.parentId)) {
            rootMenus.push(menu)
            continue
        }

        const children = childrenByParentId.get(menu.parentId) ?? []
        children.push(menu)
        childrenByParentId.set(menu.parentId, children)
    }

    const emittedIds = new Set<number>()
    const buildNode = (menu: SiteMenuTreeSource): SiteMenuTreeNode | null => {
        // Existing corrupt cyclic data must not make JSON serialization recurse
        // forever. Valid writes are separately protected against cycles.
        if (emittedIds.has(menu.id)) return null
        emittedIds.add(menu.id)

        const subPage = (childrenByParentId.get(menu.id) ?? [])
            .map(buildNode)
            .filter((child): child is SiteMenuTreeNode => child !== null)

        return {
            id: menu.id,
            name: menu.name,
            slug: menu.slug,
            pageId: menu.pageId,
            sortOrder: menu.sortOrder,
            isEnabled: menu.isEnabled,
            parentId: menu.parentId,
            icon: menu.icon,
            url: menu.url,
            target: menu.target,
            viewTypeId: menu.viewTypeRelation?.id ?? 0,
            viewType: menu.viewTypeRelation?.name,
            subPage,
        }
    }

    const tree = rootMenus
        .map(buildNode)
        .filter((menu): menu is SiteMenuTreeNode => menu !== null)

    // Surface any legacy cyclic component once instead of silently dropping it.
    for (const menu of menus) {
        const node = buildNode(menu)
        if (node) tree.push(node)
    }

    return tree
}
