import { prisma } from './prisma'
import { discardStagedUpload, MAX_UPLOAD_SIZE_BYTES } from './upload'
import { access, copyFile, mkdir, readFile, readdir, rename, rm, rmdir, stat } from 'node:fs/promises'
import { constants as fsConstants, createReadStream } from 'node:fs'
import { basename, extname, join, relative, resolve, sep } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { pipeline } from 'node:stream/promises'
import { fileTypeFromFile } from 'file-type'
import sharp, { type SharpOptions } from 'sharp'
import type { StagedUploadedFile } from './upload'
import type { H3Event } from 'h3'
import { getOptionalAuth } from './auth'

export const IMAGE_PREVIEW_EXTS = ['.png', '.jpg', '.jpeg', '.webp']
export const PDF_PREVIEW_EXTS = ['.pdf']

const MAX_IMAGE_PIXELS = 40_000_000
const MAX_ANIMATION_FRAMES = 100

export type FileCategory = 'file' | 'page' | 'news' | 'editor'

type AllowedExtension = '.jpg' | '.jpeg' | '.png' | '.gif' | '.webp' | '.pdf' | '.txt' | '.csv' | '.docx' | '.xlsx' | '.pptx'

type FormatRule = {
    detectedExtensions?: readonly string[]
    declaredMimeTypes: readonly string[]
    contentType: string
    image: boolean
}

type PreparedUpload = {
    tempPath: string
    displayName: string
    storedExtension: string
}

const FORMAT_RULES = new Map<AllowedExtension, FormatRule>([
    ['.jpg', {
        detectedExtensions: ['jpg'],
        declaredMimeTypes: ['image/jpeg', 'image/pjpeg'],
        contentType: 'image/jpeg',
        image: true,
    }],
    ['.jpeg', {
        detectedExtensions: ['jpg'],
        declaredMimeTypes: ['image/jpeg', 'image/pjpeg'],
        contentType: 'image/jpeg',
        image: true,
    }],
    ['.png', {
        detectedExtensions: ['png'],
        declaredMimeTypes: ['image/png'],
        contentType: 'image/png',
        image: true,
    }],
    ['.gif', {
        detectedExtensions: ['gif'],
        declaredMimeTypes: ['image/gif'],
        contentType: 'image/gif',
        image: true,
    }],
    ['.webp', {
        detectedExtensions: ['webp'],
        declaredMimeTypes: ['image/webp'],
        contentType: 'image/webp',
        image: true,
    }],
    ['.pdf', {
        detectedExtensions: ['pdf'],
        declaredMimeTypes: ['application/pdf'],
        contentType: 'application/pdf',
        image: false,
    }],
    ['.txt', {
        declaredMimeTypes: ['text/plain'],
        contentType: 'text/plain; charset=utf-8',
        image: false,
    }],
    ['.csv', {
        declaredMimeTypes: ['text/csv', 'application/csv', 'application/vnd.ms-excel'],
        contentType: 'text/csv; charset=utf-8',
        image: false,
    }],
    ['.docx', {
        detectedExtensions: ['docx'],
        declaredMimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        image: false,
    }],
    ['.xlsx', {
        detectedExtensions: ['xlsx'],
        declaredMimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        image: false,
    }],
    ['.pptx', {
        detectedExtensions: ['pptx'],
        declaredMimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        image: false,
    }],
])

function fileError(statusCode: number, message: string) {
    return createError({ statusCode, message })
}

export function getFilePreviewType(filePath: string): 'image' | 'pdf' | null {
    const extension = extname(filePath).toLowerCase()
    if (IMAGE_PREVIEW_EXTS.includes(extension)) return 'image'
    if (PDF_PREVIEW_EXTS.includes(extension)) return 'pdf'
    return null
}

export function getFileContentType(filePath: string): string {
    const extension = extname(filePath).toLowerCase() as AllowedExtension
    return FORMAT_RULES.get(extension)?.contentType || 'application/octet-stream'
}

export function getFileContentPath(fileId: number): string {
    return `/api/file/content/${fileId}`
}

export function getFileDownloadPath(fileId: number): string {
    return `/api/file/download/${fileId}`
}

function replaceExtension(fileName: string, extension: string): string {
    const currentExtension = extname(fileName)
    const baseName = basename(fileName, currentExtension) || 'image'
    return `${baseName}${extension}`
}

function isUtf8Text(data: Buffer): boolean {
    if (data.includes(0)) return false
    try {
        new TextDecoder('utf-8', { fatal: true }).decode(data)
        return true
    } catch {
        return false
    }
}

async function normalizeImage(uploadedFile: StagedUploadedFile, extension: AllowedExtension): Promise<PreparedUpload> {
    const isAnimated = extension === '.gif'
    const outputExtension = extension === '.gif' ? '.webp' : extension === '.jpeg' ? '.jpg' : extension
    const normalizedPath = `${uploadedFile.tempPath}.normalized${outputExtension}`

    try {
        const inputOptions: SharpOptions = {
            animated: isAnimated,
            failOn: 'warning',
            limitInputPixels: MAX_IMAGE_PIXELS,
            unlimited: false,
        }
        const metadata = await sharp(uploadedFile.tempPath, inputOptions).metadata()
        const frameCount = metadata.pages || 1
        const frameHeight = metadata.pageHeight || metadata.height || 0
        const totalPixels = (metadata.width || 0) * frameHeight * frameCount

        if (!metadata.width || !metadata.height || totalPixels <= 0 || totalPixels > MAX_IMAGE_PIXELS) {
            throw fileError(415, '圖片尺寸無效或總像素超過 4,000 萬')
        }
        if (frameCount > MAX_ANIMATION_FRAMES) {
            throw fileError(415, `動態圖片不可超過 ${MAX_ANIMATION_FRAMES} 幀`)
        }

        let transformer = sharp(uploadedFile.tempPath, inputOptions).autoOrient()
        if (outputExtension === '.jpg') {
            transformer = transformer.jpeg({ quality: 85, mozjpeg: true })
        } else if (outputExtension === '.png') {
            transformer = transformer.png({ compressionLevel: 9, adaptiveFiltering: true })
        } else {
            transformer = transformer.webp({ quality: 82, effort: 4 })
        }

        await transformer.toFile(normalizedPath)
        const normalizedStat = await stat(normalizedPath)
        if (normalizedStat.size > MAX_UPLOAD_SIZE_BYTES) {
            throw fileError(413, '圖片正規化後的大小不可超過 10 MiB')
        }

        await rm(uploadedFile.tempPath, { force: true })
        uploadedFile.tempPath = normalizedPath
        return {
            tempPath: normalizedPath,
            displayName: replaceExtension(uploadedFile.originalName, outputExtension),
            storedExtension: outputExtension,
        }
    } catch (error) {
        await rm(normalizedPath, { force: true }).catch(() => undefined)
        if (error && typeof error === 'object' && 'statusCode' in error) throw error
        throw fileError(415, '圖片內容無法安全解碼')
    }
}

async function prepareUploadedFile(uploadedFile: StagedUploadedFile, imagesOnly: boolean): Promise<PreparedUpload> {
    const originalName = basename(uploadedFile.originalName)
    const extension = extname(originalName).toLowerCase() as AllowedExtension
    const rule = FORMAT_RULES.get(extension)

    if (!originalName || !rule || (imagesOnly && !rule.image)) {
        throw fileError(415, imagesOnly
            ? '不支援的圖片格式，僅允許 JPEG、PNG、GIF、WebP；SVG 不接受原檔上傳'
            : '不支援的檔案格式，僅允許 JPEG、PNG、GIF、WebP、PDF、TXT、CSV、DOCX、XLSX、PPTX')
    }

    const uploadedStat = await stat(uploadedFile.tempPath)
    if (uploadedStat.size === 0) throw fileError(400, '不可上傳空白檔案')
    if (uploadedStat.size > MAX_UPLOAD_SIZE_BYTES) throw fileError(413, '檔案大小不可超過 10 MiB')

    if (!rule.declaredMimeTypes.includes(uploadedFile.declaredMimeType)) {
        throw fileError(415, '檔案 MIME type 與允許的格式不符')
    }

    const detectedType = await fileTypeFromFile(uploadedFile.tempPath)
    if (rule.detectedExtensions) {
        if (!detectedType || !rule.detectedExtensions.includes(detectedType.ext)) {
            throw fileError(415, '檔案內容與副檔名或 MIME type 不符')
        }
    } else {
        // file-type 官方不辨識 TXT/CSV，因此僅在沒有二進位簽章時補做嚴格 UTF-8 驗證。
        if (detectedType || !isUtf8Text(await readFile(uploadedFile.tempPath))) {
            throw fileError(415, '文字檔內容與副檔名或 MIME type 不符')
        }
    }

    if (rule.image) return await normalizeImage(uploadedFile, extension)

    return {
        tempPath: uploadedFile.tempPath,
        displayName: originalName,
        storedExtension: extension,
    }
}

function assertPathInside(root: string, target: string): void {
    const relativePath = relative(root, target)
    if (relativePath.startsWith(`..${sep}`) || relativePath === '..' || resolve(target) === resolve(root)) {
        throw fileError(400, '不安全的檔案路徑')
    }
}

export async function resolveStoredFilePath(filePath: string): Promise<string> {
    const safeRelativePath = filePath.replace(/^\/+/, '')
    if (!safeRelativePath.startsWith('uploads/')) {
        throw fileError(400, '不安全的檔案路徑')
    }

    const privateRoot = resolve(process.cwd(), '.data')
    const privatePath = resolve(privateRoot, safeRelativePath)
    assertPathInside(privateRoot, privatePath)
    try {
        await access(privatePath)
        return privatePath
    } catch {
        // 相容修正前已存在 public/uploads 的檔案；完成搬移前仍可透過受控 API 存取。
        const legacyRoot = resolve(process.cwd(), 'public')
        const legacyPath = resolve(legacyRoot, safeRelativePath)
        assertPathInside(legacyRoot, legacyPath)
        try {
            await access(legacyPath)
            return legacyPath
        } catch {
            throw fileError(404, '實體檔案不存在')
        }
    }
}

export async function removeStoredFile(filePath: string): Promise<void> {
    try {
        const absolutePath = await resolveStoredFilePath(filePath)
        await rm(absolutePath, { force: true })
    } catch {
        // rollback 清理不應覆蓋原本的資料庫錯誤
    }
}

async function migrateLegacyDirectory(sourceDir: string, destinationDir: string, quarantineDir: string): Promise<void> {
    let entries
    try {
        entries = await readdir(sourceDir, { withFileTypes: true })
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
        throw error
    }

    await mkdir(destinationDir, { recursive: true, mode: 0o700 })
    for (const entry of entries) {
        const sourcePath = join(sourceDir, entry.name)
        const destinationPath = join(destinationDir, entry.name)

        if (entry.isDirectory()) {
            await migrateLegacyDirectory(sourcePath, destinationPath, quarantineDir)
            await rmdir(sourcePath).catch(() => undefined)
            continue
        }

        if (!entry.isFile()) {
            await mkdir(quarantineDir, { recursive: true, mode: 0o700 })
            await rename(sourcePath, join(quarantineDir, `${randomUUID()}-${entry.name}`))
            continue
        }

        try {
            await copyFile(sourcePath, destinationPath, fsConstants.COPYFILE_EXCL)
            await rm(sourcePath, { force: true })
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error

            if (await filesAreIdentical(sourcePath, destinationPath)) {
                await rm(sourcePath, { force: true })
                continue
            }

            // 若目的地已存在但內容不同，不覆寫任何資料；將公開副本移出 webroot 供人工稽核。
            await mkdir(quarantineDir, { recursive: true, mode: 0o700 })
            await rename(sourcePath, join(quarantineDir, `${randomUUID()}-${entry.name}`))
        }
    }
}

async function getFileHash(filePath: string): Promise<string> {
    const hash = createHash('sha256')
    await pipeline(createReadStream(filePath), hash)
    return hash.digest('hex')
}

async function filesAreIdentical(firstPath: string, secondPath: string): Promise<boolean> {
    const [firstStat, secondStat] = await Promise.all([stat(firstPath), stat(secondPath)])
    if (firstStat.size !== secondStat.size) return false

    const [firstHash, secondHash] = await Promise.all([getFileHash(firstPath), getFileHash(secondPath)])
    return firstHash === secondHash
}

export async function migrateLegacyPublicUploads(): Promise<void> {
    const projectRoot = process.cwd()
    const destinationRoot = join(projectRoot, '.data', 'uploads')
    const quarantineRoot = join(projectRoot, '.data', 'upload-quarantine')
    const sourceRoots = [
        join(projectRoot, 'public', 'uploads'),
        join(projectRoot, '.output', 'public', 'uploads'),
    ]

    for (const sourceRoot of sourceRoots) {
        await migrateLegacyDirectory(sourceRoot, destinationRoot, quarantineRoot)
        await rmdir(sourceRoot).catch(() => undefined)
    }
}

export function createStoredFileStream(filePath: string) {
    return createReadStream(filePath)
}

export async function saveUploadedFileToSite(
    siteId: number,
    uploadedBy: number,
    uploadedFile: StagedUploadedFile,
    category: FileCategory = 'file',
    tx: Pick<typeof prisma, 'file'> = prisma,
) {
    let storedAbsolutePath: string | undefined

    try {
        const prepared = await prepareUploadedFile(uploadedFile, category === 'editor')
        const preparedStat = await stat(prepared.tempPath)
        const sha256 = await getFileHash(prepared.tempPath)
        const mimeType = FORMAT_RULES.get(prepared.storedExtension as AllowedExtension)?.contentType
        const folder = category === 'page' ? 'pages' : category === 'news' ? 'news' : 'files'
        const relativeDir = `/uploads/${folder}/${siteId}`
        const absoluteDir = join(process.cwd(), '.data', 'uploads', folder, String(siteId))
        const fileName = `${Date.now()}-${randomUUID()}${prepared.storedExtension}`
        const relativePath = `${relativeDir}/${fileName}`
        storedAbsolutePath = join(absoluteDir, fileName)

        await mkdir(absoluteDir, { recursive: true, mode: 0o700 })
        await copyFile(prepared.tempPath, storedAbsolutePath, fsConstants.COPYFILE_EXCL)
        await rm(prepared.tempPath, { force: true })

        return await tx.file.create({
            data: {
                name: prepared.displayName,
                path: relativePath,
                category,
                mimeType,
                sizeBytes: preparedStat.size,
                sha256,
                isPublic: category === 'news',
                siteId,
                uploadedBy,
            },
        })
    } catch (error) {
        if (storedAbsolutePath) await rm(storedAbsolutePath, { force: true }).catch(() => undefined)
        throw error
    } finally {
        await discardStagedUpload(uploadedFile)
    }
}

export async function getFileRecord(fileId: number) {
    return prisma.file.findUnique({
        where: { id: fileId, deletedAt: null },
    })
}

export async function getAccessibleFileRecord(event: H3Event, fileId: number) {
    const file = await prisma.file.findUnique({
        where: { id: fileId, deletedAt: null },
        include: {
            site: { select: { createdById: true } },
            pages: {
                select: {
                    status: true,
                    siteMenu: { select: { isEnabled: true, isDeleted: true } },
                },
            },
            usages: {
                select: {
                    page: {
                        select: {
                            status: true,
                            siteMenu: { select: { isEnabled: true, isDeleted: true } },
                        },
                    },
                },
            },
        },
    })
    if (!file) return null

    const isPublishedPage = (page: { status: number, siteMenu: { isEnabled: boolean, isDeleted: boolean } | null }) => (
        page.status === 1 && page.siteMenu?.isEnabled === true && page.siteMenu.isDeleted === false
    )
    const publiclyReferenced = file.pages.some(isPublishedPage)
        || file.usages.some(usage => isPublishedPage(usage.page))
    if (file.isPublic || publiclyReferenced) return file

    const authUser = await getOptionalAuth(event)
    if (authUser?.id === file.site.createdById) return file
    throw createError({ statusCode: 404, message: '找不到檔案' })
}

export async function getFileRecordByPath(filePath: string) {
    return prisma.file.findUnique({
        where: { path: filePath, deletedAt: null },
    })
}
