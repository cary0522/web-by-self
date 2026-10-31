import {
    getFileContentPath,
    getFileDownloadPath,
    getFilePreviewType,
    getAccessibleFileRecord,
    getFileRecordByPath,
} from '../../utils/file'

// 攔截修正前的 public/uploads 直連，避免歷史 SVG 或其他主動內容繞過受控輸出端點。
export default defineEventHandler(async (event) => {
    const requestedPath = getRouterParam(event, 'path') || ''
    const file = await getFileRecordByPath(`/uploads/${requestedPath}`)
    if (!file) {
        throw createError({ statusCode: 404, message: '找不到檔案' })
    }
    await getAccessibleFileRecord(event, file.id)

    const targetPath = getFilePreviewType(file.path)
        ? getFileContentPath(file.id)
        : getFileDownloadPath(file.id)

    return await sendRedirect(event, targetPath, 302)
})
