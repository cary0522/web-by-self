<script setup lang="ts">
import Swal from 'sweetalert2'
import useSiteData from '~/composables/useSiteData';
const { siteMenuList, GetSiteData } = useSiteData()

const adminStore = useAdminStore()
const router = useRouter()
const props = defineProps<{
  siteRouteDomain: string,
}>()

const normalizeSlug = (value: string) => value.startsWith('/') ? value : `/${value}`

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
  if (!adminStore.isAdmin) {
    Swal.fire({
      icon: 'warning',
      title: '請先登入',
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      router.push('/user/login')
    })
  }
  GetSiteData()
})
</script>

<template>
  <header class="fixed top-0 left-0 w-full h-20 z-50 bg-white shadow">
    <div class="w-full h-20 flex justify-start items-center px-4">
      <img :src="`/images/logo.webp`" alt="Logo" class="max-h-[100%] object-contain w-20" />
    </div>
  </header>
  <main class="pt-20 pb-16 min-h-screen flex">
    <div class="w-1/5 border min-h-screen flex flex-col px-2 py-2">
      <p class="text-lg font-black ms-1">選單</p>
      <template v-for="menu in siteMenuList">
        <NuxtLink v-if="menu.viewTypeId == 2" :to="`/`"
          class="my-2 ms-2 hover:text-black hover:underline hover:scale-105 transition-all font-black text-lg">
          {{ menu.name }}
        </NuxtLink>
        <NuxtLink v-else-if="menu.viewTypeId == 4" :to="`/${props.siteRouteDomain}/setting${normalizeSlug(menu.slug)}`"
          class="my-2 ms-2 hover:text-black hover:underline hover:scale-105 transition-all font-black text-lg">
          {{ menu.name }}
        </NuxtLink>
        <NuxtLink v-for="subPage in menu.subPage" :key="subPage.id"
          :to="`/${props.siteRouteDomain}/setting${normalizeSlug(subPage.slug)}`"
          class="my-2 ms-4 hover:text-black hover:underline hover:scale-105 transition-all">{{
            subPage.name }}
        </NuxtLink>
      </template>
      <UiButton :clickFunction="LogOut" title="登出" class="my-2" />
    </div>
    <slot />
  </main>
</template>