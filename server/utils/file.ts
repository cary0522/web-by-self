import { prisma } from './prisma'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { MultiPartData } from 'h3'

export const IMAGE_PREVIEW_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
export const PDF_PREVIEW_EXTS = ['.pdf']

export type FileCategory = 'file' | 'page' | 'news'

// 判斷檔案是否可以預覽
export function getFilePreviewType(filePath: string): 'image' | 'pdf' | null {
    const ext = extname(filePath).toLowerCase()
    if (IMAGE_PREVIEW_EXTS.includes(ext)) return 'image'
    if (PDF_PREVIEW_EXTS.includes(ext)) return 'pdf'
    return null
}

// 正規化檔名
function normalizeFileName(originalName: string): string {
    const fileExt = extname(originalName)
    const baseName = basename(originalName, fileExt)
        .replace(/[^a-zA-Z0-9-_]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'file'

    return `${Date.now()}-${randomUUID()}-${baseName}${fileExt}`
}

// 儲存上傳檔案
export async function saveUploadedFileToSite(
    siteId: number,
    uploadedBy: number,
    uploadedFile: MultiPartData,
    category: FileCategory = 'file',
    tx: any = prisma,
) {
    const originalName = uploadedFile.filename || 'upload'
    const fileName = normalizeFileName(originalName)
    const folder = category === 'page' ? 'pages' : category === 'news' ? 'news' : 'files'
    // 建立資料夾相對路徑
    const relativeDir = `/uploads/${folder}/${siteId}`
    // 建立絕對路徑
    const absoluteDir = join(process.cwd(), 'public', 'uploads', folder, String(siteId))
    // 建立完整檔案相對路徑
    const relativePath = `${relativeDir}/${fileName}`
    const data = typeof uploadedFile.data === 'string' ? Buffer.from(uploadedFile.data) : uploadedFile.data

    await mkdir(absoluteDir, { recursive: true })
    await writeFile(join(absoluteDir, fileName), data)

    return tx.file.create({
        data: {
            name: originalName,
            path: relativePath,
            siteId,
            uploadedBy,
        },
    })
}

// 用 id 查詢檔案資料
export async function getFileRecord(fileId: number) {
    return prisma.file.findUnique({
        where: { id: fileId },
    })
}
