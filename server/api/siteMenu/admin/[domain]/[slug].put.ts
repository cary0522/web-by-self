import { requireAuth } from '../../../../utils/auth'
import { getSiteByDomain } from '../../../../utils/site'
import type { H3Event, MultiPartData } from 'h3'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'

type UpdatePagePayload = {
    id?: number | string
    content?: string | null
    status?: number | string | null
    relatedFileID?: number | string | null
    title?: string | null
}
type ParsedUpdateRequest = {
    payload: UpdatePagePayload
    uploadedFilePart?: MultiPartData
}

defineRouteMeta({
    openAPI: {
        tags: ['siteMenu'],
        summary: '更新後台頁面內容',
        description: '提供給管理者使用，需登入，可回傳所有狀態的 page，並可上傳檔案',
        parameters: [
            {
                in: 'path',
                name: 'domain',
                required: true,
            },
            {
                in: 'path',
                name: 'slug',
                required: true,
            },
        ],
    },
})

// 讀取、統一 request 資料
async function readUpdatePayload(event: H3Event): Promise<ParsedUpdateRequest> {
    const contentType = getRequestHeader(event, 'content-type') || ''

    // 如果是 formdata
    if (contentType.includes('multipart/form-data')) {
        const formData = await readMultipartFormData(event)
        const payload: UpdatePagePayload = {}
        let uploadedFilePart: MultiPartData | undefined

        for (const part of formData ?? []) {
            if (part.filename) {
                uploadedFilePart = part
                continue
            }

            const value = part.data.toString()

            switch (part.name) {
                case 'id':
                    payload.id = value
                    break
                case 'content':
                    payload.content = value
                    break
                case 'status':
                    payload.status = value
                    break
                case 'relatedFileID':
                    payload.relatedFileID = value
                    break
                case 'title':
                    payload.title = value
                    break
                default:
                    break
            }
        }

        return {
            payload,
            uploadedFilePart,
        }
    }
    //  如果不是 formdata，則直接讀取 body
    return {
        payload: await readBody(event) as UpdatePagePayload,
    }
}
// 把上傳檔案存到 public，並回傳檔案資訊
async function saveUploadedFile(
    siteId: number,
    uploadedFile: MultiPartData,
): Promise<{ name: string; path: string }> {
    const originalName = uploadedFile.filename || 'upload'
    const fileExt = extname(originalName)
    const baseName = basename(originalName, fileExt)
        .replace(/[^a-zA-Z0-9-_]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'file'

    const fileName = `${Date.now()}-${randomUUID()}-${baseName}${fileExt}`
    const relativeDir = `/uploads/pages/${siteId}`
    const absoluteDir = join(process.cwd(), 'public', 'uploads', 'pages', String(siteId))
    const relativePath = `${relativeDir}/${fileName}`

    await mkdir(absoluteDir, { recursive: true })
    await writeFile(join(absoluteDir, fileName), uploadedFile.data)

    // 回傳檔案資訊
    return {
        name: originalName,
        path: relativePath,
    }
}

// /api/siteMenu/admin/:domain/:slug 更新後台頁面內容，需登入，可上傳檔案並回傳所有狀態的 page
export default defineEventHandler(async (event) => {
    const authUser = requireAuth(event)
    const domain = getRouterParam(event, 'domain') as string
    const slug = getRouterParam(event, 'slug') as string
    // 先處理 request 資料
    const { payload, uploadedFilePart } = await readUpdatePayload(event)

    const pageId = Number(payload.id)
    if (!pageId || Number.isNaN(pageId)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'page ID 為必填',
        })
    }

    const site = await getSiteByDomain(domain)
    if (!site) {
        throw createError({
            statusCode: 400,
            statusMessage: '沒有此 site',
        })
    }

    const siteMenu = await prisma.siteMenu.findFirst({
        where: {
            siteId: site.id,
            slug: '/' + slug,
            isDeleted: false,
        },
        include: {
            viewTypeRelation: true,
            page: true,
        },
    })

    if (!siteMenu) {
        throw createError({
            statusCode: 404,
            statusMessage: '沒有此 siteMenu',
        })
    }

    const viewTypeName = siteMenu.viewTypeRelation?.name?.toLowerCase()
    if (viewTypeName !== 'page' && viewTypeName !== 'pdf') {
        throw createError({
            statusCode: 400,
            statusMessage: '此頁籤不是可編輯的 page 類型',
        })
    }

    if (!siteMenu.page || siteMenu.page.id !== pageId) {
        throw createError({
            statusCode: 404,
            statusMessage: '頁面資料不存在',
        })
    }

    const nextStatus = payload.status === undefined || payload.status === null || payload.status === ''
        ? undefined
        : Number(payload.status)

    if (nextStatus !== undefined && Number.isNaN(nextStatus)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'status 格式錯誤',
        })
    }

    const nextRelatedFileId = payload.relatedFileID === undefined || payload.relatedFileID === null || payload.relatedFileID === ''
        ? undefined
        : Number(payload.relatedFileID)

    if (nextRelatedFileId !== undefined && Number.isNaN(nextRelatedFileId)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'relatedFileID 格式錯誤',
        })
    }

    const updatedPage = await prisma.$transaction(async (tx) => {
        let relatedFileID = nextRelatedFileId

        if (uploadedFilePart) {
            const savedFile = await saveUploadedFile(site.id, uploadedFilePart)
            const fileRecord = await tx.file.create({
                data: {
                    name: savedFile.name,
                    path: savedFile.path,
                    siteId: site.id,
                    uploadedBy: authUser.id,
                },
            })
            relatedFileID = fileRecord.id
        }

        return tx.page.update({
            where: {
                id: siteMenu.page!.id,
            },
            data: {
                title: payload.title ?? undefined,
                content: payload.content ?? undefined,
                ...(nextStatus !== undefined ? { status: nextStatus } : {}),
                ...(relatedFileID !== undefined ? { relatedFileID } : {}),
                updatedBy: authUser.id,
            },
            include: {
                file: true,
                sections: {
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
            },
        })
    })

    return {
        ...updatedPage,
        pageId: updatedPage.id,
    }
})