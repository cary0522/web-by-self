<script setup lang="ts">
import Swal from 'sweetalert2'

const adminStore = useAdminStore()
const router = useRouter()

// 取得所有管理頁籤，渲染側邊欄

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
  console.log('AdminStore:', adminStore)
})
</script>

<template>
  <header class="fixed top-0 left-0 w-full h-20 z-50 bg-white shadow">
    <div class="w-full h-20 flex justify-start items-center px-4">
      <img :src="`/images/logo.webp`" alt="Logo" class="max-h-[100%] object-contain w-20" />
    </div>
  </header>
  <main class="pt-20 pb-16 min-h-screen">
    <slot />
  </main>
</template>