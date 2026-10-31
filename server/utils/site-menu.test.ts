import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
// @ts-expect-error Node's native type-stripping runner requires the explicit .ts extension.
import { assertHomeMenuAvailable, assertValidMenuParent, buildSiteMenuTree, getMenuSubtreeIds, isUniqueConstraintError, normalizeSiteMenuSlug, parseSiteMenuDestination, parseSiteMenuFields } from './site-menu.ts'

type HttpErrorOptions = {
    statusCode: number
    message: string
}

Object.assign(globalThis, {
    createError(options: HttpErrorOptions) {
        return Object.assign(new Error(options.message), options)
    },
})

describe('site menu validation', () => {
    it('parses common fields independently from the destination type', () => {
        assert.deepEqual(parseSiteMenuFields({
            name: ' Menu ',
            slug: ' menu ',
            viewTypeId: 1,
            sortOrder: 0,
            content: null,
        }), {
            name: 'Menu',
            viewTypeId: 1,
            sortOrder: 0,
            isEnabled: undefined,
            icon: null,
            content: null,
            hasContent: true,
        })
    })

    it('rejects malformed IDs, sort order, text and content', () => {
        const valid = { name: 'Menu', slug: 'menu', viewTypeId: 1, sortOrder: 0 }

        assert.throws(() => parseSiteMenuFields({ ...valid, viewTypeId: undefined }), /viewType ID/)
        assert.throws(() => parseSiteMenuFields({ ...valid, viewTypeId: '1' }), /viewType ID/)
        assert.throws(() => parseSiteMenuFields({ ...valid, viewTypeId: -1 }), /viewType ID/)
        assert.throws(() => parseSiteMenuFields({ ...valid, viewTypeId: 1.5 }), /viewType ID/)
        assert.throws(() => parseSiteMenuFields({ ...valid, sortOrder: -1 }), /排序格式/)
        assert.throws(() => parseSiteMenuFields({ ...valid, sortOrder: 1.5 }), /排序格式/)
        assert.throws(() => parseSiteMenuFields({ ...valid, sortOrder: '0' }), /排序格式/)
        assert.throws(() => parseSiteMenuFields({ ...valid, name: undefined }), /頁籤名稱/)
        assert.throws(() => parseSiteMenuFields({ ...valid, name: 'x'.repeat(201) }), /200/)
        assert.throws(() => parseSiteMenuFields({ ...valid, content: {} }), /內容格式/)
    })

    it('defaults an omitted sort order to zero', () => {
        const parsed = parseSiteMenuFields({ name: 'Menu', slug: 'menu', viewTypeId: 1 })
        assert.equal(parsed.sortOrder, 0)
    })

    it('normalizes internal slugs and validates external destinations', () => {
        assert.equal(normalizeSiteMenuSlug(' about '), '/about')
        assert.deepEqual(parseSiteMenuDestination({ slug: 'about' }, 'page'), {
            slug: '/about', activeSlug: '/about', url: null, target: null,
        })
        assert.deepEqual(parseSiteMenuDestination({ url: 'https://example.com', target: '_blank' }, 'external'), {
            slug: null, activeSlug: null, url: 'https://example.com', target: '_blank',
        })
        assert.deepEqual(parseSiteMenuDestination({}, 'parent'), {
            slug: null, activeSlug: null, url: null, target: null,
        })
        assert.throws(() => parseSiteMenuDestination({ url: 'javascript:alert(1)' }, 'external'), /僅允許/)
        assert.throws(() => normalizeSiteMenuSlug('parent/child'), /單一路徑/)
    })
})

describe('site menu hierarchy', () => {
    const menus = [
        { id: 1, parentId: null },
        { id: 2, parentId: 1 },
        { id: 3, parentId: 2 },
        { id: 4, parentId: null },
    ]

    it('rejects using the current menu or one of its descendants as parent', () => {
        assert.throws(() => assertValidMenuParent(menus, 1, 1), /子孫/)
        assert.throws(() => assertValidMenuParent(menus, 3, 1), /子孫/)
    })

    it('allows an unrelated parent and collects a complete deletion subtree', () => {
        assert.doesNotThrow(() => assertValidMenuParent(menus, 4, 1))
        assert.deepEqual(getMenuSubtreeIds(menus, 1), [1, 2, 3])
    })

    it('rejects a parent omitted from the active menu list', () => {
        assert.throws(() => assertValidMenuParent(menus, 99), /不存在或已刪除/)
    })

    it('allows only one active home menu per site', () => {
        const typedMenus = [
            { id: 1, viewTypeRelation: { name: 'home' } },
            { id: 2, viewTypeRelation: { name: 'page' } },
        ]

        assert.throws(
            () => assertHomeMenuAvailable(typedMenus, 'HOME'),
            (error: unknown) => error instanceof Error
                && 'statusCode' in error
                && error.statusCode === 409,
        )
        assert.doesNotThrow(() => assertHomeMenuAvailable(typedMenus, 'home', 1))
        assert.doesNotThrow(() => assertHomeMenuAvailable(typedMenus, 'page'))
    })
})

describe('site menu response tree', () => {
    const sourceMenu = (
        id: number,
        parentId: number | null,
        viewType: string,
        sortOrder: number,
        isEnabled = true,
    ) => ({
        id,
        parentId,
        name: `Menu ${id}`,
        slug: `menu-${id}`,
        pageId: id,
        sortOrder,
        isEnabled,
        icon: null,
        url: null,
        target: null,
        viewTypeRelation: { id: id + 10, name: viewType },
    })

    it('keeps every root type and builds all hierarchy levels in linear passes', () => {
        const tree = buildSiteMenuTree([
            sourceMenu(1, null, 'page', 1, false),
            sourceMenu(2, 1, 'link', 2),
            sourceMenu(3, 2, 'page', 3),
            sourceMenu(4, 3, 'pdf', 4),
            sourceMenu(5, null, 'link', 5),
        ])

        assert.deepEqual(tree.map(menu => menu.id), [1, 5])
        assert.equal(tree[0]?.isEnabled, false)
        assert.equal(tree[0]?.sortOrder, 1)
        assert.equal(tree[0]?.subPage[0]?.sortOrder, 2)
        assert.equal(tree[0]?.subPage[0]?.subPage[0]?.subPage[0]?.id, 4)
        assert.equal(tree[0]?.subPage[0]?.isEnabled, true)
    })

    it('surfaces an orphan or cyclic legacy component without recursing forever', () => {
        const tree = buildSiteMenuTree([
            sourceMenu(1, 99, 'page', 1),
            sourceMenu(2, 3, 'page', 2),
            sourceMenu(3, 2, 'page', 3),
        ])

        assert.deepEqual(tree.map(menu => menu.id), [1, 2])
        assert.equal(tree[1]?.subPage[0]?.id, 3)
    })
})

describe('site menu database errors', () => {
    it('recognizes Prisma unique constraint conflicts', () => {
        assert.equal(isUniqueConstraintError({ code: 'P2002' }), true)
        assert.equal(isUniqueConstraintError({ code: 'P2003' }), false)
        assert.equal(isUniqueConstraintError(null), false)
    })
})
