// 全站路由守衛：在進入任何後台頁面前，先向伺服器確認登入狀態，
// 避免未登入狀態下畫面閃爍、或可直接瀏覽後台頁面結構。
//
// 受保護路徑：
// - /dp_index              （網站列表 / 建立 / 頁籤管理儀表板）
// - /:domain/setting        （首頁區塊管理）
// - /:domain/setting/:slug  （一般頁面內容管理）
const PROTECTED_PATH_PATTERNS = [
    /^\/dp_index(?:\/.*)?$/,
    /^\/[^/]+\/setting(?:\/.*)?$/,
]

interface AuthMeResponse {
    id: number
    account: string
    email: string | null
    name: string | null
    role: number
    isActive: boolean
}

export default defineNuxtRouteMiddleware(async (to) => {
    const isProtected = PROTECTED_PATH_PATTERNS.some(pattern => pattern.test(to.path))
    if (!isProtected) return

    const adminStore = useAdminStore()

    try {
        // SSR 時需要手動帶上原始請求的 cookie，瀏覽器端 $fetch 會自動帶上同源 cookie。
        const user = await $fetch<AuthMeResponse | null>('/api/auth/me', {
            headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
        })

        if (!user) {
            throw new Error('未登入')
        }

        adminStore.setAdminData({
            id: user.id,
            account: user.account,
            mail: user.email ?? '',
            name: user.name ?? '',
            role: String(user.role),
        })
        adminStore.isLoggedIn = true
        adminStore.isAdmin = user.role === 1
    }
    catch {
        adminStore.clearAdminData()
        return navigateTo('/user/login')
    }
})
