import { prisma } from '../utils/prisma'

defineRouteMeta({
    openAPI: {
        tags: ['check'],
        summary: '健康檢查 API',
        description: '提供服務健康檢查的 API，檢查資料庫連線狀態',
    },
})

export default defineEventHandler(async () => {
    try {
        await prisma.$queryRaw`SELECT 1`

        return {
            ok: true,
            service: 'web-by-self',
            database: 'connected',
            timestamp: new Date().toISOString(),
        }
    } catch (error) {
        throw createError({
            statusCode: 503,
            statusMessage: 'Database Unavailable',
            data: {
                ok: false,
                service: 'web-by-self',
                database: 'disconnected',
                message: error instanceof Error ? error.message : 'Unknown database error',
            },
        })
    }
})