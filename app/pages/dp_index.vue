<template>
    <LayoutAdmin :site-route-domain="siteRouteDomain">
        <div class="page-shell">
            <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p class="text-sm font-bold uppercase tracking-[0.18em] text-primary-600">Dashboard</p>
                    <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">網站設定</h1>
                    <p class="mt-2 text-sm leading-6 text-slate-500">管理網站基本資訊、導覽頁籤與頁面層級。</p>
                </div>
                <div v-if="siteList.length" class="flex items-center gap-2">
                    <select v-model.number="siteData.id" aria-label="選擇站台" @change="SelectSite(siteData.id)">
                        <option v-for="site in siteList" :key="site.id" :value="site.id">{{ site.name }}</option>
                    </select>
                    <UiButton title="新增站台" variant="secondary" :click-function="StartNewSite" />
                </div>
                <span v-if="siteData.id !== 0" class="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    <span class="h-2 w-2 rounded-full bg-emerald-500"></span>網站已建立
                </span>
            </div>

            <section class="surface-card p-5 sm:p-7">
                <UiAreaTitle title="網站基本資訊" />
                <div class="grid gap-5 md:grid-cols-2">
                    <label for="siteName" class="block">
                        <span class="field-label">網站名稱</span>
                        <input type="text" id="siteName" v-model="siteData.name" placeholder="例如：我的品牌網站" />
                    </label>
                    <label for="siteDomain" class="block">
                        <span class="field-label">網站域名</span>
                        <input type="text" id="siteDomain" v-model="siteData.domain" placeholder="例如：my-site" />
                        <span class="mt-1.5 block text-xs text-slate-400">請使用簡短、容易辨識的英文代稱。</span>
                    </label>
                </div>
                <div class="mt-6 flex justify-end">
                    <UiButton v-if="siteData.id === 0" :click-function="CreateSite" title="建立網站" />
                    <UiButton v-else :click-function="UpdateSite" title="儲存網站資訊" />
                </div>
            </section>

            <template v-if="siteData.id !== 0">
                <section class="surface-card mt-6 p-5 sm:p-7">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <UiAreaTitle title="頁籤管理" />
                        <span class="text-sm text-slate-400">共 {{ siteMenuList.length }} 個主項目</span>
                    </div>

                    <div v-if="siteMenuList.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                        <p class="font-semibold text-slate-700">目前還沒有頁籤</p>
                        <p class="mt-1 text-sm text-slate-500">從下方新增第一個網站導覽項目。</p>
                    </div>

                    <div v-else class="space-y-4">
                        <article v-for="menu in siteMenuList" :key="menu.id" class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                            <UiSiteMenu :data="menu" />
                            <div class="mt-4 flex flex-wrap justify-end gap-2">
                                <UiButton :click-function="() => UpdateSiteMenu(menu)" title="更新" variant="secondary" />
                                <UiButton :click-function="() => DeleteSiteMenu(menu)" title="刪除" variant="danger" />
                            </div>

                            <div v-if="menu.subPage.length" class="mt-5 space-y-3 border-t border-slate-200 pt-5">
                                <p class="text-xs font-bold uppercase tracking-wider text-slate-400">子頁籤</p>
                                <div v-for="sub in menu.subPage" :key="sub.id" class="rounded-xl border border-slate-200 bg-white p-4">
                                    <UiSiteMenu :data="sub" />
                                    <div class="mt-4 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                                        <label class="block">
                                            <span class="field-label">所屬父頁籤</span>
                                            <select name="parentPage" v-model="sub.parentId">
                                                <option v-for="option in parentList" :key="option.id" :value="option.id">{{ option.name }}</option>
                                            </select>
                                        </label>
                                        <div class="flex flex-wrap justify-end gap-2">
                                            <UiButton :click-function="() => UpdateSiteMenu(sub)" title="更新子頁籤" variant="secondary" />
                                            <UiButton :click-function="() => DeleteSiteMenu(sub)" title="刪除" variant="danger" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>
                </section>

                <section class="surface-card mt-6 p-5 sm:p-7">
                    <UiAreaTitle title="新增頁籤" />
                    <UiSiteMenu :data="siteMenuData" />
                    <div class="mt-4 grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <label v-if="!isParent(siteMenuData.viewTypeId)" class="block">
                            <span class="field-label">所屬父頁籤</span>
                            <select name="parent" v-model="siteMenuData.parentId">
                                <option :value="null">不指定</option>
                                <option v-for="option in parentList" :key="option.id" :value="option.id">{{ option.name }}</option>
                            </select>
                        </label>
                        <div v-else></div>
                        <UiButton :click-function="CreateSiteMenu" title="新增頁籤" />
                    </div>
                </section>
            </template>
        </div>
    </LayoutAdmin>
</template>

<script setup lang="ts">
import Swal from 'sweetalert2';
import type { SiteMenu } from '~/shared/types/site-menu';
import useSiteData from '~/composables/useSiteData';
import useOptions from '~/composables/useOptions'
import { VIEW_TYPE } from '~/utils/enums'
const { siteData, siteList, siteMenuList, GetSiteData, SelectSite } = useSiteData()
const { ViewTypeList, GetViewTypeList } = useOptions()

const siteRouteDomain = computed(() => siteData.value.domain.replace(/^\/+/, ''))
function StartNewSite() {
    siteData.value = { id: 0, name: '', domain: '' }
    siteMenuList.value = []
}
// 單筆頁籤資料
const siteMenuData = ref<SiteMenu>({
    id: 0,
    name: '',
    slug: null,
    viewTypeId: 0,
    sortOrder: 0,
    isEnabled: true,
    parentId: null,
    subPage: []
})
// 清空頁籤資料
function ResetSiteMenuData() {
    siteMenuData.value = {
        id: 0,
        name: '',
        slug: null,
        viewTypeId: 0,
        sortOrder: 0,
        isEnabled: true,
        parentId: null,
        subPage: []
    }
}
// 所有父頁籤資料
const parentList = computed(() => siteMenuList.value.filter(menu => menu.viewType === VIEW_TYPE.PARENT))

const isParent = (id: number) => {
    return ViewTypeList.value.find(v => v.id === id)?.name === VIEW_TYPE.PARENT
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
            text: err.data?.message || '網站建立失敗，請稍後再試',
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
            text: err.data?.message || '網站更新失敗，請稍後再試',
        })
    })
}
// 更新頁籤資料
function UpdateSiteMenu(menu: SiteMenu) {
    const viewType = ViewTypeList.value.find(item => item.id === menu.viewTypeId)?.name.toLowerCase()
    const needsSlug = ['home', 'page', 'pdf'].includes(viewType || '')
    const needsUrl = viewType === VIEW_TYPE.EXTERNAL
    if (!menu.name || menu.viewTypeId === 0 || (needsSlug && !menu.slug) || (needsUrl && !menu.url)) {
        Swal.fire({
            icon: 'warning',
            title: '請填寫頁籤資訊',
            text: '請確認頁籤名稱、類型及連結資料',
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
            sortOrder: menu.sortOrder,
            parentId: menu.parentId,
            url: menu.url,
            target: menu.target,
            icon: menu.icon,
            isEnabled: menu.isEnabled,
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
            text: err.data?.message || '頁籤更新失敗，請稍後再試',
        })
    })
}
// 新增頁籤資料
function CreateSiteMenu() {
    const viewType = ViewTypeList.value.find(item => item.id === siteMenuData.value.viewTypeId)?.name.toLowerCase()
    const needsSlug = ['home', 'page', 'pdf'].includes(viewType || '')
    const needsUrl = viewType === VIEW_TYPE.EXTERNAL
    if (!siteMenuData.value.name || siteMenuData.value.viewTypeId === 0
        || (needsSlug && !siteMenuData.value.slug) || (needsUrl && !siteMenuData.value.url)) {
        Swal.fire({
            icon: 'warning',
            title: '請填寫頁籤資訊',
            text: '請確認頁籤名稱、類型及連結資料',
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
            url: siteMenuData.value.url,
            target: siteMenuData.value.target,
            icon: siteMenuData.value.icon,
            isEnabled: siteMenuData.value.isEnabled,
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
            text: err.data?.message || '頁籤建立失敗，請稍後再試',
        })
    })
}

function DeleteSiteMenu(menu: SiteMenu) {
    $fetch('/api/siteMenu/delete', {
        method: 'DELETE' as any,
        body: {
            menuId: menu.id,
            name: menu.name,
            viewTypeId: menu.viewTypeId,
        }
    }).then((res) => {
        Swal.fire({
            icon: 'success',
            title: '頁籤刪除成功',
            confirmButtonText: '確定',
        }).then(() => {
            GetSiteData()
            ResetSiteMenuData()
        })
    }).catch((err) => {
        Swal.fire({
            icon: 'error',
            title: '頁籤刪除失敗',
            text: err.data?.message || '頁籤刪除失敗，請稍後再試',
        })
    })
}

onMounted(() => {
    GetSiteData()
    GetViewTypeList()
})

</script>
