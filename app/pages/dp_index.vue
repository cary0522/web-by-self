<script setup lang="ts">
import Swal from 'sweetalert2';
import { ref } from 'vue';

const adminStore = useAdminStore()
const router = useRouter()
// 取得這個網站的資料
// 網站資料:增刪修查api
// 有網站資料之後，才能取得這個使用者所有後台頁籤
// 頁籤:增刪修查api

const siteName = ref('')
const siteMenuData = ref({
    name: '',
    slug: '',
    viewType: '',
})
const siteMenuList = ref([
    {
        name: '',
        slug: '',
        viewType: '',
    },
])

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

</script>

<template>
    <LayoutAdmin>
        <div class="h-screen">
            <h1 class="text-4xl font-bold w-full">管理者後台</h1>
            <div class="w-full px-2 flex">
                <div class="w-1/6 border min-h-screen">選單
                    <UiButton :clickFunction="LogOut" title="登入" />
                </div>
                <div class="grow border min-h-screen">
                    <div>
                        <h3>
                            網站管理
                        </h3>
                        <input type="text" v-model="siteData.name" placeholder="網站名稱" class="border p-1" />
                        <UiButton :clickFunction="CreateSite" v-if="siteData.id === 0" title="建立網站" />
                        <UiButton :clickFunction="UpdateSite" v-if="siteData.id !== 0" title="更新網站名稱" />
                    </div>
                    <div>
                        <h3>
                            頁籤管理
                        </h3>
                        <div v-for="menu in siteMenuList" :key="menu.slug" class="flex items-center">
                            <p>{{ menu.name }}</p>
                            <p>{{ menu.slug }}</p>
                            <p>{{ menu.viewType }}</p>
                        </div>
                        <input type="text" v-model="siteMenuData.name" placeholder="頁籤名稱" class="border p-1" />
                        <input type="text" v-model="siteMenuData.slug" placeholder="頁籤slug" class="border p-1" />
                        <input type="text" v-model="siteMenuData.viewType" placeholder="頁籤view type"
                            class="border p-1" />
                    </div>
                </div>
            </div>
        </div>
    </LayoutAdmin>
</template>