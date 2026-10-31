import { handleSiteWriteError, parseSiteFields } from '../../utils/site-domain'

defineRouteMeta({
    openAPI: {
        tags: ['site'],
        summary: '建立網站設定',
        description: '建立網站設定',
    },
})

// /api/site/create 新增網站設定
export default defineEventHandler(async (event) => {
    const authUser = await requireAdmin(event)
    const fields = parseSiteFields(await readBody<unknown>(event))

    const res = await prisma.site.create({
        data: {
            ...fields,
            createdById: authUser.id,
        },
    }).catch(handleSiteWriteError)

    return {
        id: res.id,
        name: res.name,
        domain: res.domain,
    }
})
