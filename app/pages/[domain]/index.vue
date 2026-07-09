<template>
    <LayoutUser>
        <UiNav :domain="domain"></UiNav>
        <div class="px-4 py-2 text-sm text-gray-500">
            首頁內容
        </div>
        <div v-if="pageData?.length == 0">尚無內容</div>
        <div v-else v-for="section in pageData" :key="section.id">
            <h2>{{ section.title }}</h2>
            <div>{{ section.bodyJson }}</div>
        </div>
    </LayoutUser>
</template>

<script lang="ts" setup>
interface PageSection {
    id: number,
    pageId: number,
    type: string,
    title?: string | null,
    bodyJson?: string | null,
    sortOrder: number,
    isEnabled: Boolean
}

const route = useRoute()
const domain = Array.isArray(route.params.domain)
    ? (route.params.domain[0] ?? '')
    : (typeof route.params.domain === 'string' ? route.params.domain : '')
const now = new Date()

const { data: pageData } = await useAsyncData<PageSection[] | null>(
    `page-${domain}-home-${now.getTime()}`,
    async () => {
        if (!domain) return null
        return await $fetch<PageSection[]>(`/api/page/${domain}/home/block`)
    },
)

</script>
