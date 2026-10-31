<template>
    <LayoutUser>
        <div class="bg-hero-glow px-4 py-12 sm:px-6 sm:py-20">
            <div class="surface-card mx-auto w-full max-w-md p-6 sm:p-8">
                <div class="mb-8 text-center">
                    <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-xl text-primary-700">↗</span>
                    <h1 class="mt-4 text-3xl font-black tracking-tight text-slate-950">歡迎回來</h1>
                    <p class="mt-2 text-sm leading-6 text-slate-500">登入後繼續管理你的網站內容</p>
                </div>
                <form class="space-y-5" @submit.prevent="login">
                <label for="userAccount" class="block">
                    <span class="field-label">帳號或 Email</span>
                    <input id="userAccount" type="text" placeholder="請輸入帳號或 Email" v-model="userData.account" autocomplete="username">
                </label>
                <label for="userPassword" class="block">
                    <span class="field-label">密碼</span>
                    <input id="userPassword" type="password" placeholder="請輸入密碼" v-model="userData.password" autocomplete="current-password">
                </label>
                <UiButton title="登入" type="submit" class="w-full" />
                </form>
                <p class="mt-6 text-center text-sm text-slate-500">
                    還沒有帳號？
                    <NuxtLink to="/user/register" class="font-semibold text-primary-700 hover:text-primary-800 hover:underline">立即免費註冊</NuxtLink>
                </p>
            </div>
        </div>
    </LayoutUser>
</template>

<script setup lang="ts">
import Swal from 'sweetalert2'

const router = useRouter()
const adminStore = useAdminStore()

const userData = reactive({
    account: '',
    password: '',
})

async function login() {
    if (!userData.account || !userData.password) {
        await Swal.fire({
            icon: 'warning',
            title: '請填寫完整',
            text: '請輸入帳號或 Email 以及密碼',
        })
        return
    }

    try {
        const res = await $fetch('/api/auth/login', {
            method: 'POST',
            body: userData,
        })

        // 將回傳資料存入 adminStore
        adminStore.setAdminData({
            id: res.id,
            account: res.account,
            mail: res.email ?? '',
            name: res.name ?? '',
            role: String(res.role),
        })
        adminStore.isLoggedIn = true
        adminStore.isAdmin = res.role === 1 // 請依照實際 role 數值調整

        await Swal.fire({
            icon: 'success',
            title: '登入成功',
            text: `歡迎回來，${res.name || res.account}`,
            timer: 1500,
            showConfirmButton: false,
        })

        router.push('/dp_index')
    }
    catch (err: any) {
        await Swal.fire({
            icon: 'error',
            title: '登入失敗',
            text: err.data?.message || '登入失敗，請稍後再試',
        })
        window.location.reload()
    }
}
</script>
