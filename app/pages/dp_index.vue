<script setup lang="ts">
import Swal from 'sweetalert2';
import type { SiteMenu } from '~/types/site-menu';

const adminStore = useAdminStore()
const router = useRouter()
// 網站資料
const siteData = ref({
    id: 0,
    name: '',
    domain: '',
})
// 單筆頁籤資料
const siteMenuData = ref<SiteMenu>({
    id: 0,
    name: '',
    slug: '',
    viewTypeId: 0,
    parentId: null,
    subPage: []
})
// 清空頁籤資料
function ResetSiteMenuData() {
    siteMenuData.value = {
        id: 0,
        name: '',
        slug: '',
        viewTypeId: 0,
        parentId: null,
        subPage: []
    }
}
// 所有頁籤資料
const siteMenuList = ref<SiteMenu[]>([])
// 所有父頁籤資料
const parentList = computed(() => siteMenuList.value.filter(menu => menu.viewTypeId == 4))

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
// 更新頁籤資料
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
            parentId: siteMenuData.value.parentId,
        }
    }).then((res) => {
        Swal.fire({
            icon: 'success',
            title: '頁籤更新成功',
            confirmButtonText: '確定',
        }).then(() => {
            GetSiteData()
            ResetSiteMenuData()
        })
    }).catch((err) => {
        Swal.fire({
            icon: 'error',
            title: '頁籤更新失敗',
            text: err.data?.statusMessage || '頁籤更新失敗，請稍後再試',
        })
    })
}
// 新增頁籤資料
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
            parentId: siteMenuData.value.parentId,
        }
    }).then((res) => {
        Swal.fire({
            icon: 'success',
            title: '頁籤建立成功',
            confirmButtonText: '確定',
        }).then(() => {
            GetSiteData()
            ResetSiteMenuData()
        })
    }).catch((err) => {
        Swal.fire({
            icon: 'error',
            title: '頁籤建立失敗',
            text: err.data?.statusMessage || '頁籤建立失敗，請稍後再試',
        })
    })
}

onMounted(() => {
    GetSiteData()
})

</script>

<template>
    <LayoutAdmin>
        <div class="h-screen">
            <h1 class="text-4xl font-bold w-full">管理者後台</h1>
            <div class="w-full px-2 flex">
                <div class="w-1/5 border min-h-screen flex flex-col">
                    <p class="text-lg font-black ms-1">選單</p>
                    <template v-for="menu in siteMenuList">
                        <NuxtLink :to="menu.viewTypeId == 4 ? '' : `/setting${menu.slug}`"
                            class="my-2 ms-2 hover:text-black hover:underline hover:scale-105 transition-all font-black text-lg">
                            {{
                                menu.name }}
                        </NuxtLink>
                        <NuxtLink v-for="subPage in menu.subPage" :key="subPage.id" :to="`/setting${subPage.slug}`"
                            class="my-2 ms-4 hover:text-black hover:underline hover:scale-105 transition-all">{{
                                subPage.name }}
                        </NuxtLink>
                    </template>
                    <UiButton :clickFunction="LogOut" title="登出" class="my-2" />
                </div>
                <div class="grow border min-h-screen">
                    <div>
                        <UiAreaTitle :title="'網站管理'"> </UiAreaTitle>
                        <div class="w-full ps-4">
                            <div class="my-1">
                                <label for="siteName">網站名稱：</label>
                                <input type="text" id="siteName" v-model="siteData.name" placeholder="網站名稱" />
                            </div>
                            <div class="my-1">
                                <label for="siteDomain">網站域名：</label>
                                <input type="text" id="siteDomain" v-model="siteData.domain" placeholder="網站域名" />
                            </div>
                        </div>
                        <div class="w-full flex justify-center items-center">
                            <UiButton :clickFunction="CreateSite" v-if="siteData.id === 0" title="建立網站" />
                            <UiButton :clickFunction="UpdateSite" v-if="siteData.id !== 0" title="更新網站名稱" />
                        </div>
                    </div>
                    <div v-if="siteData.id !== 0">
                        <UiAreaTitle :title="'頁籤管理'"> </UiAreaTitle>
                        <div v-for="menu in siteMenuList" v-if="siteMenuList.length > 0" :key="menu.slug"
                            class="flex flex-wrap items-center">
                            <UiSiteMenu :data="menu"></UiSiteMenu>
                            <UiButton :clickFunction="UpdateSiteMenu" title="更新" />
                            <div v-for="sub in menu.subPage" class="border w-full px-4 py-4 flex items-center">
                                <UiSiteMenu :data="sub"></UiSiteMenu>
                                <label for="parentPage">父頁籤：</label>
                                <select name="parentPage" id="parentPage" v-model="sub.parentId">
                                    <option v-for="option in parentList" :key="option.id" :value="option.id">
                                        {{ option.name }}
                                    </option>
                                </select>
                                <UiButton :clickFunction="UpdateSiteMenu" title="更新子頁籤" />
                            </div>
                        </div>
                        <UiAreaTitle :title="'新增頁籤'"> </UiAreaTitle>
                        <div class="w-full flex">
                            <UiSiteMenu :data="siteMenuData"></UiSiteMenu>
                            <select name="parent" id="parent" v-model="siteMenuData.parentId"
                                v-if="siteMenuData.viewTypeId !== 4">
                                <option v-for="option in parentList" :key="option.id" :value="option.id">
                                    {{ option.name }}
                                </option>
                            </select>
                            <UiButton :clickFunction="CreateSiteMenu" title="新增頁籤" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </LayoutAdmin>
</template>