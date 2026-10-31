<template>
    <LayoutUser>
        <div class="bg-hero-glow px-4 py-12 sm:px-6 sm:py-20">
            <div class="surface-card mx-auto w-full max-w-md p-6 sm:p-8">
                <div class="mb-8 text-center">
                    <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-xl text-pink-600">✦</span>
                    <h1 class="mt-4 text-3xl font-black tracking-tight text-slate-950">建立你的帳號</h1>
                    <p class="mt-2 text-sm leading-6 text-slate-500">只要幾個步驟，就能開始打造網站</p>
                </div>
                <form class="space-y-5" @submit.prevent="Register">
                <label for="userAccount" class="block">
                    <span class="field-label">帳號</span>
                    <input id="userAccount" type="text" placeholder="設定登入帳號" v-model="userData.account" autocomplete="username">
                </label>
                <label for="userEmail" class="block">
                    <span class="field-label">Email</span>
                    <input id="userEmail" type="email" placeholder="name@example.com" v-model="userData.email" autocomplete="email">
                </label>
                <label for="userPassword" class="block">
                    <span class="field-label">密碼</span>
                    <input id="userPassword" type="password" placeholder="設定安全密碼" v-model="userData.password" autocomplete="new-password">
                </label>
                <UiButton title="建立帳號" type="submit" class="w-full" />
                </form>
                <p class="mt-6 text-center text-sm text-slate-500">
                    已經有帳號？
                    <NuxtLink to="/user/login" class="font-semibold text-primary-700 hover:text-primary-800 hover:underline">回到登入</NuxtLink>
                </p>
            </div>
        </div>
    </LayoutUser>
</template>

<script setup lang="ts">
import Swal from 'sweetalert2'

const router = useRouter()

const userData = {
    account: '',
    email: '',
    password: '',
}

async function Register() {
    if (!userData.account || !userData.email || !userData.password) {
        await Swal.fire({
            icon: 'warning',
            title: '請填寫完整註冊資料',
            text: '請輸入帳號、信箱以及密碼',
        })
        return
    }
    $fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    }).then((res) => {
        Swal.fire({
            icon: 'success',
            title: '註冊成功',
            text: `請使用帳號密碼進行登入`,
            timer: 1500,
            showConfirmButton: false,
        }).then(() => {
            router.push('/user/login')
        })
    }).catch((err) => {
        Swal.fire({
            icon: 'error',
            title: '註冊失敗',
            text: err.data?.message || '註冊失敗，請稍後再試',
        })
    })
}
// 健康檢查
function CheckApi() {
    $fetch('/api/check').catch((err) => {
        Swal.fire({
            icon: 'error',
            title: err.message
        })
    })
}

onMounted(() => {
    CheckApi()
})
</script>
