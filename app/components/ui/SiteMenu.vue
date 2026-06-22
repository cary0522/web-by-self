<script setup lang="ts">
import type { SiteMenu } from '~/types/site-menu'

const props = defineProps<{
    data: SiteMenu
}>()

import useOptions from '~/composables/useOptions'
const { ViewTypeList, GetViewTypeList } = useOptions()

onMounted(() => {
    GetViewTypeList()
})
</script>
<template>
    <div class="flex items-center">
        <p class="mx-2">頁籤名稱：
            <input type="text" v-model="data.name" />
        </p>
        <p class="mx-2">Slug：
            <input type="text" v-model="data.slug" />
        </p>
        <label for="viewType">頁籤類別：</label>
        <select name="viewType" id="viewType" v-model="data.viewTypeId">
            <option v-for="option in ViewTypeList" :key="option.id" :value="option.id">
                {{ option.name }}
            </option>
        </select>
    </div>
</template>