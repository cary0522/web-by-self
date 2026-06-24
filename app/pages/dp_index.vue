<script setup lang="ts">
import Swal from 'sweetalert2';
import type { SiteMenu } from '~/types/site-menu';
import useSiteData from '~/composables/useSiteData';
const { siteData, siteMenuList, GetSiteData } = useSiteData()

const siteRouteDomain = computed(() => siteData.value.domain.replace(/^\/+/, ''))
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
// 所有父頁籤資料
const parentList = computed(() => siteMenuList.value.filter(menu => menu.viewTypeId == 4))

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
function UpdateSiteMenu(menu: SiteMenu) {
    if (!menu.name || !menu.slug || menu.viewTypeId == 0) {
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
            menuId: menu.id,
            siteId: siteData.value.id,
            name: menu.name,
            slug: menu.slug,
            viewTypeId: menu.viewTypeId,
            parentId: menu.parentId,
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
    <LayoutAdmin :siteRouteDomain="siteRouteDomain">
        <div class="wrap">
            <h1 class="text-4xl font-bold w-full">管理者後台</h1>
            <div class="w-full px-2 flex">
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
                            <UiButton :clickFunction="() => UpdateSiteMenu(menu)" title="更新" />
                            <div v-for="sub in menu.subPage" class="border w-full px-4 py-4 flex items-center">
                                <UiSiteMenu :data="sub"></UiSiteMenu>
                                <label for="parentPage">父頁籤：</label>
                                <select name="parentPage" id="parentPage" v-model="sub.parentId">
                                    <option v-for="option in parentList" :key="option.id" :value="option.id">
                                        {{ option.name }}
                                    </option>
                                </select>
                                <UiButton :clickFunction="() => UpdateSiteMenu(sub)" title="更新子頁籤" />
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