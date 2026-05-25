<script setup lang="ts">

// 登入畫面

const UserData = {
    accountOrEmail: '',
    password: '',
}

function Login() {
    if (!UserData.accountOrEmail || !UserData.password) {
        alert('請輸入帳號或 email 以及密碼')
        return
    }
    $fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(UserData),
    }).then((res) => {
        // 登入成功，處理回傳的使用者資料（例如存到 Vuex 或 Pinia）
        console.log('登入成功', res)
    }).catch((err) => {
        // 登入失敗，顯示錯誤訊息
        console.error('登入失敗', err)
        alert(err.data?.message || '登入失敗，請稍後再試')
    })
}
</script>

<template>
    <LayoutUser>
        <div class="flex h-screen items-center justify-center">
            <h1 class="text-4xl font-bold">使用者登入畫面</h1>
            <input type="text" placeholder="帳號或 Email" v-model="UserData.accountOrEmail">
            <input type="password" placeholder="密碼" v-model="UserData.password">
            <button @click="Login">登入</button>
        </div>
    </LayoutUser>
</template>