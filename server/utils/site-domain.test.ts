import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
// @ts-expect-error Node's native type-stripping runner requires the explicit .ts extension.
import { handleSiteWriteError, normalizeSiteDomain, parseSiteFields } from './site-domain.ts'

type HttpErrorOptions = {
    statusCode: number
    message: string
}

Object.assign(globalThis, {
    createError(options: HttpErrorOptions) {
        return Object.assign(new Error(options.message), options)
    },
})

describe('normalizeSiteDomain', () => {
    it('adds one leading slash to a route domain', () => {
        assert.equal(normalizeSiteDomain('example'), '/example')
    })

    it('does not duplicate an existing leading slash', () => {
        assert.equal(normalizeSiteDomain('/example'), '/example')
        assert.equal(normalizeSiteDomain('//example'), '/example')
    })

    it('trims surrounding whitespace and rejects an empty value', () => {
        assert.equal(normalizeSiteDomain('  example  '), '/example')
        assert.equal(normalizeSiteDomain(' / '), '')
    })
})

describe('site fields validation', () => {
    it('trims a valid name and normalizes a valid route domain', () => {
        assert.deepEqual(parseSiteFields({
            name: ' My Site ',
            domain: '/my-site_2',
        }), {
            name: 'My Site',
            domain: '/my-site_2',
        })
    })

    it('rejects invalid names', () => {
        assert.throws(() => parseSiteFields({ name: 123, domain: 'site' }), /網站名稱格式錯誤/)
        assert.throws(() => parseSiteFields({ name: '   ', domain: 'site' }), /網站名稱為必填/)
        assert.throws(() => parseSiteFields({ name: 'x'.repeat(201), domain: 'site' }), /200/)
    })

    it('rejects domains that are not one safe route segment', () => {
        const invalidDomains = [123, '', 'my site', '/abc/def', 'abc?x=1', 'abc#title', '.']
        for (const domain of invalidDomains) {
            assert.throws(() => parseSiteFields({ name: 'Site', domain }))
        }
    })

    it('converts Prisma unique conflicts to an HTTP 409', () => {
        assert.throws(
            () => handleSiteWriteError({ code: 'P2002' }),
            (error: unknown) => (
                error instanceof Error
                && 'statusCode' in error
                && error.statusCode === 409
                && /Domain/.test(error.message)
            ),
        )
    })
})
