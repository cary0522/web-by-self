import busboy from 'busboy'
import { createWriteStream } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { H3Event } from 'h3'

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
export const MAX_MULTIPART_BODY_SIZE_BYTES = MAX_UPLOAD_SIZE_BYTES + 2 * 1024 * 1024

const MAX_FIELD_SIZE_BYTES = 1024 * 1024
const MAX_FIELDS = 20
const MAX_PARTS = MAX_FIELDS + 1

export type StagedUploadedFile = {
    fieldName: string
    originalName: string
    declaredMimeType: string
    encoding: string
    tempPath: string
}

export type ParsedMultipartUpload = {
    fields: Record<string, string>
    file?: StagedUploadedFile
}

function uploadError(statusCode: number, message: string) {
    return createError({ statusCode, message })
}

export async function discardStagedUpload(file?: StagedUploadedFile): Promise<void> {
    if (!file) return
    await rm(file.tempPath, { force: true }).catch(() => undefined)
}

export async function parseMultipartUpload(event: H3Event): Promise<ParsedMultipartUpload> {
    const contentType = getRequestHeader(event, 'content-type') || ''
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
        throw uploadError(400, 'Content-Type 必須為 multipart/form-data')
    }

    const contentLengthHeader = getRequestHeader(event, 'content-length')
    const transferEncoding = getRequestHeader(event, 'transfer-encoding')
    if (contentLengthHeader && transferEncoding) {
        throw uploadError(400, '請求不可同時包含 Content-Length 與 Transfer-Encoding')
    }
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : undefined
    if (contentLength !== undefined && Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BODY_SIZE_BYTES) {
        throw uploadError(413, '上傳請求大小不可超過 12 MiB')
    }

    const tempDir = join(process.cwd(), '.data', 'upload-tmp')
    await mkdir(tempDir, { recursive: true, mode: 0o700 })

    let parser: ReturnType<typeof busboy>
    try {
        parser = busboy({
            headers: event.node.req.headers,
            defParamCharset: 'utf8',
            limits: {
                fileSize: MAX_UPLOAD_SIZE_BYTES,
                files: 1,
                fields: MAX_FIELDS,
                parts: MAX_PARTS,
                fieldSize: MAX_FIELD_SIZE_BYTES,
                headerPairs: 100,
            },
        })
    } catch {
        throw uploadError(400, 'multipart/form-data 格式錯誤')
    }

    const request = event.node.req
    const fields: Record<string, string> = {}
    let stagedFile: StagedUploadedFile | undefined
    let fileWriteTask: Promise<void> | undefined
    let parseFailure: unknown

    const setFailure = (error: unknown) => {
        parseFailure ||= error
    }

    parser.on('file', (fieldName, stream, info) => {
        if (!info.filename) {
            stream.resume()
            return
        }

        if (stagedFile) {
            setFailure(uploadError(400, '一次只能上傳一個檔案'))
            stream.resume()
            return
        }

        const tempPath = join(tempDir, `${randomUUID()}.upload`)
        stagedFile = {
            fieldName,
            originalName: basename(info.filename),
            declaredMimeType: info.mimeType.toLowerCase(),
            encoding: info.encoding,
            tempPath,
        }

        let exceededFileSize = false
        stream.once('limit', () => {
            exceededFileSize = true
        })

        fileWriteTask = pipeline(
            stream,
            createWriteStream(tempPath, { flags: 'wx', mode: 0o600 }),
        ).then(() => {
            if (exceededFileSize) {
                throw uploadError(413, '檔案大小不可超過 10 MiB')
            }
        }).catch((error) => {
            setFailure(error)
        })
    })

    parser.on('field', (name, value, info) => {
        if (info.nameTruncated || info.valueTruncated) {
            setFailure(uploadError(413, '表單欄位大小超過限制'))
            return
        }
        fields[name] = value
    })

    parser.once('filesLimit', () => setFailure(uploadError(400, '一次只能上傳一個檔案')))
    parser.once('fieldsLimit', () => setFailure(uploadError(400, '表單欄位數量超過限制')))
    parser.once('partsLimit', () => setFailure(uploadError(400, 'multipart/form-data 欄位數量超過限制')))

    try {
        let receivedBytes = 0
        const bodySizeLimiter = new Transform({
            transform(chunk: Buffer, _encoding, callback) {
                receivedBytes += chunk.length
                if (receivedBytes > MAX_MULTIPART_BODY_SIZE_BYTES) {
                    callback(uploadError(413, '上傳請求大小不可超過 12 MiB'))
                    return
                }
                callback(null, chunk)
            },
        })

        await pipeline(request, bodySizeLimiter, parser)

        await fileWriteTask
        if (parseFailure) throw parseFailure

        return { fields, file: stagedFile }
    } catch (error) {
        await discardStagedUpload(stagedFile)
        if (error && typeof error === 'object' && 'statusCode' in error) throw error
        throw uploadError(400, '無法解析上傳內容')
    }
}
