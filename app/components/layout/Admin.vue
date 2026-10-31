<template>
  <div class="min-h-screen bg-slate-50">
    <header class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div class="flex h-20 items-center justify-between px-4 sm:px-6">
        <NuxtLink to="/dp_index" class="flex items-center gap-3">
          <img src="/images/logo.webp" alt="Web by Self"
            class="h-11 w-11 rounded-xl object-cover shadow-sm ring-1 ring-slate-200" />
          <div>
            <p class="font-extrabold tracking-tight text-slate-900">Web by Self</p>
            <p class="text-xs text-slate-500">網站管理後台</p>
          </div>
        </NuxtLink>
        <span
          class="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
          管理員模式
        </span>
      </div>
    </header>
    <main class="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[96rem] flex-col lg:flex-row">
      <aside
        class="border-b border-slate-200 bg-white px-4 py-4 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <p class="mb-3 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">網站選單</p>
        <nav class="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="管理選單">
          <template v-for="menu in siteMenuList" :key="menu.id">
            <NuxtLink v-if="menu.viewType === VIEW_TYPE.HOME" :to="`/${props.siteRouteDomain}/setting`"
              class="shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-primary-50 hover:text-primary-700"
              active-class="bg-primary-50 text-primary-700">
              {{ menu.name }}
            </NuxtLink>
            <p v-else-if="menu.viewType === VIEW_TYPE.PARENT"
              class="shrink-0 px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              {{ menu.name }}
            </p>
            <NuxtLink v-for="subPage in menu.subPage.filter(item => item.slug)" :key="subPage.id"
              :to="`/${props.siteRouteDomain}/setting${subPage.slug}`"
              class="shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:pl-5"
              active-class="bg-primary-50 text-primary-700">
              {{ subPage.name }}
            </NuxtLink>
          </template>
        </nav>
        <div class="mt-4 border-t border-slate-100 pt-4 lg:mt-8">
          <UiButton :click-function="LogOut" title="登出" variant="ghost" class="w-full" />
        </div>
      </aside>
      <section class="min-w-0 flex-1">
        <slot />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import Swal from 'sweetalert2'
import useSiteData from '~/composables/useSiteData';
import { VIEW_TYPE } from '~/utils/enums'
const { siteMenuList, GetSiteData } = useSiteData()

const adminStore = useAdminStore()
const router = useRouter()
const props = defineProps<{
  siteRouteDomain: string,
}>()

// 登出
function LogOut() {
  adminStore.logOut().then(() => {
    Swal.fire({
      icon: 'success',
      title: '登出成功',
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      router.push('/user/login')
    })
  })
}
onMounted(() => {
  // 登入狀態已由全域路由守衛（app/middleware/auth.global.ts）於進入頁面前確認，
  // 這裡只需要載入頁面所需的網站資料。
  GetSiteData()
})
</script>
