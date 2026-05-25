<script setup lang="ts">

// 註冊畫面

const UserData = {
    account: '',
    email: '',
    password: '',
}

function Register() {
    if (!UserData.account || !UserData.email || !UserData.password) {
        alert('請輸入帳號、Email 以及密碼')
        return
    }
    $fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(UserData),
    }).then((res) => {
        // 註冊成功，處理回傳的使用者資料（例如存到 Vuex 或 Pinia）
        console.log('註冊成功', res)
    }).catch((err) => {
        // 註冊失敗，顯示錯誤訊息
        console.error('註冊失敗', err)
        alert(err.data?.message || '註冊失敗，請稍後再試')
    })
}
</script>

<template>
    <LayoutUser>
        <div class="flex h-screen items-center justify-center">
            <h1 class="text-4xl font-bold">使用者註冊畫面</h1>
            <input type="text" placeholder="帳號" v-model="UserData.account">
            <input type="text" placeholder="Email" v-model="UserData.email">
            <input type="password" placeholder="密碼" v-model="UserData.password">
            <button @click="Register">註冊</button>
        </div>
    </LayoutUser>
</template>