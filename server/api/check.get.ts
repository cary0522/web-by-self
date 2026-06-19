import { prisma } from '../utils/prisma'

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