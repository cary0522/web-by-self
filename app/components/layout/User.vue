<script setup lang="ts">
// 取得所有前台頁籤，渲染navbar
// 取得網站名稱、logo，渲染畫面


</script>

<template>
    <header class="fixed top-0 left-0 w-full h-24 z-50 bg-white shadow">
        <div class="w-full h-24 flex justify-between items-center px-4">
            <div class="flex justify-start items-center w-1/3 py-2 my-2 h-full">
                <img :src="`/images/logo.webp`" alt="Logo" class="max-h-[100%] object-cover w-20 rounded-full" />
                <p class="mx-4 text-2xl font-bold">SiteName</p>
            </div>
            <div class="w-1/2"></div>
        </div>
    </header>
    <main class="pt-20 pb-16 min-h-screen">
        <slot />
    </main>
    <footer class="fixed bottom-0 left-0 w-full h-16 z-50 bg-black shadow"></footer>
</template>