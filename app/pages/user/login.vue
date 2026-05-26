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
            text: err.data?.statusMessage || '登入失敗，請稍後再試',
        })
        window.location.reload()
    }
}
</script>

<template>
    <LayoutUser>
        <div class="h-screen mt-24">
            <h1 class="text-4xl font-bold mx-4">使用者登入畫面</h1>
            <div class="w-full px-4 py-4">
                <label for="userAccount" class="block w-full my-2">
                    帳號：
                    <input id="userAccount" type="text" placeholder="帳號或 Email" v-model="userData.account" class="border rounded px-1 py-1">
                </label>
                <label for="userPassword" class="block w-full my-2">
                    密碼：
                    <input id="userPassword" type="password" placeholder="密碼" v-model="userData.password" class="border rounded px-1 py-1">
                </label>
                <div class="w-full my-2 flex justify-center items-center">
                    <UiButton :clickFunction="login" title="登入" />
                </div>
            </div>
        </div>
    </LayoutUser>
</template>