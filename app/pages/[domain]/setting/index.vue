<template>
    <LayoutAdmin :site-route-domain="domain">
        <div class="wrap space-y-6 p-6">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">首頁區塊管理</h1>
                <p class="mt-1 text-sm text-slate-500">新增、排序、啟用或編輯首頁顯示內容。</p>
            </div>

            <div class="flex flex-wrap gap-2">
                <UiButton v-for="item in registryEntries" :key="item.type" :title="`新增${item.label}`"
                    :click-function="() => addSection(item.type)" />
            </div>

            <p v-if="sections.length === 0" class="rounded-xl border border-dashed p-8 text-center text-slate-500">
                尚無首頁區塊
            </p>

            <article v-for="section in sections" :key="section.id" class="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
                <div class="flex flex-wrap items-center gap-4">
                    <strong>{{ pageSectionRegistry[section.type].label }}</strong>
                    <label class="flex-1">
                        <span class="field-label">標題</span>
                        <input v-model="section.title" type="text" maxlength="200" />
                    </label>
                    <label>
                        <span class="field-label">排序</span>
                        <input v-model.number="section.sortOrder" type="number" min="0" />
                    </label>
                    <label class="flex items-center gap-2">
                        <input v-model="section.isEnabled" type="checkbox" /> 啟用
                    </label>
                </div>

                <label class="block">
                    <span class="field-label">區塊資料（JSON）</span>
                    <textarea v-model="bodyDrafts[section.id]" rows="10" class="font-mono text-sm"></textarea>
                </label>

                <div class="flex gap-2">
                    <UiButton title="儲存" :click-function="() => saveSection(section)" />
                    <UiButton title="刪除" variant="danger" :click-function="() => removeSection(section.id)" />
                </div>
            </article>
        </div>
    </LayoutAdmin>
</template>

<script setup lang="ts">
import Swal from 'sweetalert2'
import { pageSectionRegistry } from '~/constants/page-section-ui-registry'
import type { PageSection, PageSectionType } from '~/shared/types/page-section'

const route = useRoute()
const domain = Array.isArray(route.params.domain) ? route.params.domain[0] || '' : String(route.params.domain || '')
const registryEntries = Object.entries(pageSectionRegistry).map(([type, config]) => ({
    type: type as PageSectionType,
    ...config,
}))

const { data } = await useAsyncData(`admin-sections-${domain}`, () =>
    $fetch<PageSection[]>(`/api/page/admin/${domain}/home/block`),
)
const sections = ref<PageSection[]>(data.value ?? [])
const bodyDrafts = reactive<Record<number, string>>({})

function syncDraft(section: PageSection) {
    bodyDrafts[section.id] = JSON.stringify(section.bodyJson, null, 2)
}
sections.value.forEach(syncDraft)

async function addSection(type: PageSectionType) {
    const maxOrder = sections.value.reduce((max, item) => Math.max(max, item.sortOrder), -1)
    try {
        const section = await $fetch<PageSection>(`/api/page/admin/${domain}/home/block`, {
            method: 'POST',
            body: {
                type,
                title: null,
                bodyJson: pageSectionRegistry[type].createDefaultBody(),
                sortOrder: maxOrder + 1,
                isEnabled: true,
            },
        })
        sections.value.push(section)
        syncDraft(section)
    } catch (error: any) {
        await Swal.fire({ icon: 'error', title: '新增失敗', text: error.data?.message || '請稍後再試' })
    }
}

async function saveSection(section: PageSection) {
    try {
        const bodyJson = JSON.parse(bodyDrafts[section.id] || '{}')
        const updated = await $fetch<PageSection>(`/api/page/admin/${section.id}/block`, {
            method: 'PUT',
            body: {
                title: section.title,
                bodyJson,
                sortOrder: section.sortOrder,
                isEnabled: section.isEnabled,
            },
        })
        Object.assign(section, updated)
        syncDraft(section)
        await Swal.fire({ icon: 'success', title: '已儲存', timer: 1000, showConfirmButton: false })
    } catch (error: any) {
        await Swal.fire({ icon: 'error', title: '儲存失敗', text: error.data?.message || 'JSON 格式錯誤' })
    }
}

async function removeSection(id: number) {
    const result = await Swal.fire({ icon: 'warning', title: '確定刪除此區塊？', showCancelButton: true })
    if (!result.isConfirmed) return
    try {
        await $fetch(`/api/page/admin/${id}/block`, { method: 'DELETE' })
        sections.value = sections.value.filter(section => section.id !== id)
        delete bodyDrafts[id]
    } catch (error: any) {
        await Swal.fire({ icon: 'error', title: '刪除失敗', text: error.data?.message || '請稍後再試' })
    }
}
</script>
