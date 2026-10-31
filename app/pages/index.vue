<template>
    <LayoutUser>
        <section class="relative isolate overflow-hidden bg-white bg-hero-glow">
            <div class="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
                <div class="max-w-2xl">
                    <span class="inline-flex items-center rounded-full bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-700 ring-1 ring-inset ring-primary-200">
                        讓內容成為網站的主角
                    </span>
                    <h1 class="mt-6 text-4xl font-black leading-[1.15] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                        輕鬆建立一個<br />
                        <span class="text-primary-600">真正屬於你</span>的網站
                    </h1>
                    <p class="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                        從頁面、導覽到內容管理，用清楚直覺的方式完成設定。無需複雜流程，也能讓你的想法漂亮上線。
                    </p>
                    <div class="mt-8 flex flex-col gap-3 sm:flex-row">
                        <NuxtLink to="/user/register" class="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-soft hover:-translate-y-0.5 hover:bg-primary-700">
                            免費開始建立
                            <span class="ml-2" aria-hidden="true">→</span>
                        </NuxtLink>
                        <NuxtLink to="/user/login" class="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
                            登入管理後台
                        </NuxtLink>
                    </div>
                </div>
                <div class="relative mx-auto w-full max-w-lg">
                    <div class="absolute -inset-5 -z-10 rotate-3 rounded-[2.5rem] bg-primary-100/70"></div>
                    <div class="surface-card overflow-hidden rounded-[2rem] p-3 sm:p-4">
                        <img src="/images/logo.webp" alt="繽紛的網站創作插圖" class="aspect-square w-full rounded-[1.5rem] object-cover" />
                    </div>
                    <div class="absolute -bottom-5 -left-3 rounded-2xl bg-white px-4 py-3 shadow-soft ring-1 ring-slate-200 sm:-left-8">
                        <p class="text-xs font-medium text-slate-500">準備就緒</p>
                        <p class="mt-0.5 flex items-center gap-2 text-sm font-bold text-slate-900">
                            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>你的網站，隨時上線
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <section class="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="max-w-2xl">
                    <p class="text-sm font-bold uppercase tracking-[0.18em] text-primary-600">Simple by design</p>
                    <h2 class="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">建站需要的基礎，都幫你準備好了</h2>
                </div>
                <div class="mt-10 grid gap-5 md:grid-cols-3">
                    <article v-for="feature in features" :key="feature.title" class="surface-card p-6 sm:p-7">
                        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-xl ring-1 ring-inset ring-primary-100">{{ feature.icon }}</div>
                        <h3 class="mt-5 text-lg font-bold text-slate-900">{{ feature.title }}</h3>
                        <p class="mt-2 text-sm leading-7 text-slate-600">{{ feature.description }}</p>
                    </article>
                </div>
            </div>
        </section>
    </LayoutUser>
</template>

<script setup lang="ts">
// 取得首頁排版及對應的資料:banner、公告等等
const features = [
    { icon: '✦', title: '直覺內容管理', description: '用清楚的欄位與編輯器整理頁面，更新內容不再需要碰程式碼。' },
    { icon: '⌘', title: '彈性網站導覽', description: '自由建立主選單與子頁面，讓訪客快速找到真正重要的資訊。' },
    { icon: '↗', title: '響應式版面', description: '基礎介面已針對手機、平板與桌面調整，任何裝置都自然易讀。' },
]
</script>
