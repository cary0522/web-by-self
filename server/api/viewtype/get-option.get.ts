export default defineEventHandler(async () => {
    const res = await prisma.viewType.findMany()

    return res
})