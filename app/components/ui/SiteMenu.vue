<template>
    <div class="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label v-if="requiresSlug" class="block">
            <span class="field-label">頁籤名稱</span>
            <input type="text" v-model="data.name" placeholder="例如：關於我們" />
        </label>
        <label v-if="isExternal" class="block sm:col-span-2">
            <span class="field-label">外部連結</span>
            <input type="url" v-model="data.url" placeholder="https://example.com" />
        </label>
        <label v-if="isExternal" class="block">
            <span class="field-label">開啟方式</span>
            <select v-model="data.target">
                <option value="_self">目前視窗</option>
                <option value="_blank">新視窗</option>
            </select>
        </label>
        <label class="block">
            <span class="field-label">網址代稱（Slug）</span>
            <input type="text" v-model="data.slug" placeholder="例如：about" />
        </label>
        <label class="flex items-center gap-2 self-end pb-3">
            <input type="checkbox" v-model="data.isEnabled" />
            <span>啟用</span>
        </label>
        <label class="block">
            <span class="field-label">頁籤類別</span>
            <select name="viewType" v-model="data.viewTypeId">
            <option v-for="option in ViewTypeList" :key="option.id" :value="option.id">
                {{ option.name }}
            </option>
            </select>
        </label>
        <label class="block">
            <span class="field-label">排序</span>
            <input type="number" v-model="data.sortOrder" min="0" />
        </label>
    </div>
</template>

<script setup lang="ts">
import type { SiteMenu } from '~/shared/types/site-menu'
import useOptions from '~/composables/useOptions'

const data = defineModel<SiteMenu>('data', { required: true })
const { ViewTypeList, GetViewTypeList } = useOptions()
const selectedViewType = computed(() => ViewTypeList.value
    .find(option => option.id === data.value.viewTypeId)?.name.toLowerCase())
const isExternal = computed(() => selectedViewType.value === 'external')
const requiresSlug = computed(() => ['home', 'page', 'pdf'].includes(selectedViewType.value || ''))

onMounted(() => {
    GetViewTypeList()
})
</script>
