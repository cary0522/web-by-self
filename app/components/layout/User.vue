<template>
    <div class="flex min-h-screen flex-col bg-slate-50">
        <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
            <div class="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <NuxtLink to="/" class="group flex min-w-0 items-center gap-3" aria-label="回到首頁">
                    <img src="/images/logo.webp" alt="Web by Self" class="h-11 w-11 rounded-xl object-cover shadow-sm ring-1 ring-slate-200" />
                    <div class="min-w-0">
                        <p class="truncate text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">Web by Self</p>
                        <p class="hidden text-xs text-slate-500 sm:block">打造屬於你的網站</p>
                    </div>
                </NuxtLink>
                <nav class="flex items-center gap-1 sm:gap-2" aria-label="會員功能">
                    <NuxtLink to="/user/login" class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                        登入
                    </NuxtLink>
                    <NuxtLink to="/user/register" class="rounded-xl bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700">
                        免費註冊
                    </NuxtLink>
                </nav>
            </div>
        </header>
        <main class="min-h-0 flex-1">
            <slot />
        </main>
        <footer class="border-t border-slate-200 bg-white">
            <div class="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <p>© {{ currentYear }} Web by Self</p>
                <p>簡單管理，專注分享。</p>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
// 取得所有前台頁籤，渲染navbar
// 取得網站名稱、logo，渲染畫面
const currentYear = new Date().getFullYear()
</script>
