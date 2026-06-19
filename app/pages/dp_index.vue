<script setup lang="ts">
import Swal from 'sweetalert2';
import { ref } from 'vue';

const adminStore = useAdminStore()
const router = useRouter()
// 取得這個網站的資料
// 網站資料:增刪修查api
// 有網站資料之後，才能取得這個使用者所有後台頁籤
// 頁籤:增刪修查api

interface SiteMenu {
    id: number,
    name: string,
    slug: string,
    viewTypeId: number,
}

interface ViewType {
    id: number,
    name: string,
    description: string,
}

const siteData = ref({
    id: 0,
    name: '',
    domain: '',
})
const siteMenuData = ref({
    name: '',
    slug: '',
    viewTypeId: 0,
})
const siteMenuList = ref<SiteMenu[]>([])

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
// 取得網站資訊
async function GetSiteData() {
    try {
        const res = await $fetch<{ id: number, name: string, domain: string } | null>('/api/site')
        if (res) {
            siteData.value.name = res.name
            siteData.value.domain = res.domain
            siteData.value.id = res.id
            // 取得網站的頁籤資訊
            const menuRes = await $fetch<SiteMenu[]>(`/api/siteMenu/${res.id}`)
            siteMenuList.value = menuRes
        } else {
            siteData.value.name = ''
            siteData.value.domain = ''
            siteData.value.id = 0
        }
    }
    catch (err: any) {
        if (err.data?.statusCode === 401) {
            router.push('/user/login')
        }
    }
}
// 新增網站資訊
function CreateSite() {
    if (!siteData.value.name) {
        Swal.fire({
            icon: 'warning',
            title: '請填寫網站名稱',
            text: '請輸入網站名稱',
        })
        return
    }

    $fetch('/api/site/create', {
        method: 'POST',
        body: {
            name: siteData.value.name,
            domain: siteData.value.domain,
        },
    }).then((res) => {
        Swal.fire({
            icon: 'success',
            title: '網站建立成功',
            confirmButtonText: '確定',
        }).then(() => {
            GetSiteData()
        })
    }).catch((err) => {
        Swal.fire({
            icon: 'error',
            title: '網站建立失敗',
            text: err.data?.statusMessage || '網站建立失敗，請稍後再試',
        })
    })
}
// 更新網站資訊
function UpdateSite() {
    if (!siteData.value.name) {
        Swal.fire({
            icon: 'warning',
            title: '請填寫網站名稱',
            text: '請輸入網站名稱',
        })
        return
    }

    $fetch('/api/site/update', {
        method: 'PUT' as any,
        body: {
            siteId: siteData.value.id,
            name: siteData.value.name,
            domain: siteData.value.domain,
        }
    }).then((res) => {
        Swal.fire({
            icon: 'success',
            title: '網站更新成功',
            confirmButtonText: '確定',
        }).then(() => {
            GetSiteData()
        })
    }).catch((err) => {
        Swal.fire({
            icon: 'error',
            title: '網站更新失敗',
            text: err.data?.statusMessage || '網站更新失敗，請稍後再試',
        })
    })
}

function UpdateSiteMenu() {
    if (!siteMenuData.value.name || !siteMenuData.value.slug || siteMenuData.value.viewTypeId == 0) {
        Swal.fire({
            icon: 'warning',
            title: '請填寫頁籤資訊',
            text: '請輸入頁籤名稱、slug、view type',
        })
        return
    }

    $fetch('/api/siteMenu/update', {
        method: 'PUT' as any,
        body: {
            siteId: siteData.value.id,
            name: siteMenuData.value.name,
            slug: siteMenuData.value.slug,
            viewTypeId: siteMenuData.value.viewTypeId,
        }
    }).then((res) => {
        Swal.fire({
            icon: 'success',
            title: '頁籤更新成功',
            confirmButtonText: '確定',
        }).then(() => {
            GetSiteData()
        })
    }).catch((err) => {
        Swal.fire({
            icon: 'error',
            title: '頁籤更新失敗',
            text: err.data?.statusMessage || '頁籤更新失敗，請稍後再試',
        })
    })
}
function CreateSiteMenu() {
    if (!siteMenuData.value.name || !siteMenuData.value.slug || siteMenuData.value.viewTypeId == 0) {
        Swal.fire({
            icon: 'warning',
            title: '請填寫頁籤資訊',
            text: '請輸入頁籤名稱、slug、view type',
        })
        return
    }

    $fetch('/api/siteMenu/create', {
        method: 'POST',
        body: {
            siteId: siteData.value.id,
            name: siteMenuData.value.name,
            slug: siteMenuData.value.slug,
            viewTypeId: siteMenuData.value.viewTypeId,
        }
    }).then((res) => {
        Swal.fire({
            icon: 'success',
            title: '頁籤建立成功',
            confirmButtonText: '確定',
        }).then(() => {
            GetSiteData()
        })
    }).catch((err) => {
        Swal.fire({
            icon: 'error',
            title: '頁籤建立失敗',
            text: err.data?.statusMessage || '頁籤建立失敗，請稍後再試',
        })
    })
}
const viewTypeOptions = ref<ViewType[]>([])
// 取得viewType選項
async function GetViewTypeOptions() {
    const res = await $fetch('/api/viewtype/get-option')
    viewTypeOptions.value = res as ViewType[]
}

onMounted(() => {
    GetSiteData()
    GetViewTypeOptions()
})

</script>

<template>
    <LayoutAdmin>
        <div class="h-screen">
            <h1 class="text-4xl font-bold w-full">管理者後台</h1>
            <div class="w-full px-2 flex">
                <div class="w-1/6 border min-h-screen flex flex-col">
                    <p class="text-lg font-black ms-1">選單</p>
                    <NuxtLink v-for="menu in siteMenuList" :key="menu.id" :to="`/setting/${menu.slug}`" class="my-2 ms-2 hover:text-black hover:underline hover:scale-105 transition-all">{{ menu.name }}</NuxtLink>
                    <UiButton :clickFunction="LogOut" title="登出" class="my-2" />
                </div>
                <div class="grow border min-h-screen">
                    <div>
                        <h3>
                            網站管理
                        </h3>
                        <input type="text" v-model="siteData.name" placeholder="網站名稱" class="border p-1" />
                        <input type="text" v-model="siteData.domain" placeholder="網站域名" class="border p-1" />
                        <UiButton :clickFunction="CreateSite" v-if="siteData.id === 0" title="建立網站" />
                        <UiButton :clickFunction="UpdateSite" v-if="siteData.id !== 0" title="更新網站名稱" />
                    </div>
                    <div v-if="siteData.id !== 0">
                        <h3>
                            頁籤管理
                        </h3>
                        <div v-for="menu in siteMenuList" v-if="siteMenuList.length > 0" :key="menu.slug"
                            class="flex items-center">
                            <p>{{ menu.name }}</p>
                            <p>{{ menu.slug }}</p>
                            <select name="viewType" id="viewType" v-model="menu.viewTypeId" disabled>
                                <option v-for="option in viewTypeOptions" :key="option.id" :value="option.id">
                                    {{ option.name }}
                                </option>
                            </select>
                            <UiButton :clickFunction="UpdateSiteMenu" title="更新" />
                        </div>
                        <input type="text" v-model="siteMenuData.name" placeholder="頁籤名稱" class="border p-1" />
                        <input type="text" v-model="siteMenuData.slug" placeholder="頁籤slug" class="border p-1" />
                        <select name="viewType" id="viewType" v-model="siteMenuData.viewTypeId">
                            <option v-for="option in viewTypeOptions" :key="option.id" :value="option.id">
                                {{ option.name }}
                            </option>
                        </select>
                        <UiButton :clickFunction="CreateSiteMenu" title="新增頁籤" />
                    </div>
                </div>
            </div>
        </div>
    </LayoutAdmin>
</template>