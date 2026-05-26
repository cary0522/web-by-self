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
</script>

<template>
    <LayoutUser>
        <div class="h-screen mt-24">
            <h1 class="text-4xl font-bold mx-4">使用者註冊畫面</h1>
            <div class="w-full px-4 py-4">
                <label for="userAccount" class="block w-full my-2">
                    帳號：
                    <input id="userAccount" type="text" placeholder="帳號" v-model="userData.account"
                        class="border rounded px-1 py-1">
                </label>
                <label for="userEmail" class="block w-full my-2">
                    信箱：
                    <input id="userEmail" type="email" placeholder="Email" v-model="userData.email"
                        class="border rounded px-1 py-1">
                </label>
                <label for="userPassword" class="block w-full my-2">
                    密碼：
                    <input id="userPassword" type="password" placeholder="密碼" v-model="userData.password"
                        class="border rounded px-1 py-1">
                </label>
                <div class="w-full my-2 flex justify-center items-center">
                    <button @click="Register"
                        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">註冊</button>
                </div>
            </div>
        </div>
    </LayoutUser>
</template>