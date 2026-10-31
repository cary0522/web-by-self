import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
// @ts-expect-error Node's native type-stripping runner requires the explicit .ts extension.
import { getCarouselFileIds, parsePageSectionCreate, parsePageSectionUpdate } from './page-section.ts'

Object.assign(globalThis, {
    createError(options: { statusCode: number, message: string }) {
        return Object.assign(new Error(options.message), options)
    },
})

describe('page section validation', () => {
    it('accepts a valid rich-text section', () => {
        const parsed = parsePageSectionCreate({
            type: 'richText',
            title: ' Intro ',
            bodyJson: { contentHtml: '<p>Hello</p>', textAlign: 'left', maxWidth: '960px' },
            sortOrder: 0,
            isEnabled: true,
        })
        assert.equal(parsed.title, 'Intro')
        assert.equal(parsed.type, 'richText')
    })

    it('rejects unknown types, mismatched bodies and type changes', () => {
        assert.throws(() => parsePageSectionCreate({ type: 'banner', bodyJson: {}, sortOrder: 0 }), /type/)
        assert.throws(() => parsePageSectionCreate({
            type: 'carousel',
            bodyJson: { images: [], autoplay: true, interval: 5, showArrows: true, showDots: true },
            sortOrder: 0,
        }), /interval/)
        assert.throws(() => parsePageSectionUpdate({ type: 'table' }, 'richText'), /不可變更/)
    })

    it('collects unique carousel file references', () => {
        const body = {
            images: [{ fileId: 1 }, { fileId: 2 }],
            autoplay: true,
            interval: 5000,
            showArrows: true,
            showDots: true,
        }
        const parsed = parsePageSectionCreate({ type: 'carousel', bodyJson: body, sortOrder: 1 })
        assert.deepEqual(getCarouselFileIds(parsed.type, parsed.bodyJson), [1, 2])
    })
})
