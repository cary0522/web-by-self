// /api/auth/logout 登出
export default defineEventHandler(async (event) => {
    deleteCookie(event, 'auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    })

    return { success: true }
})