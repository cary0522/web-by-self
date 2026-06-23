<script lang="ts" setup>
interface PageContent {
    content?: string | null
}

const route = useRoute()
const domain = Array.isArray(route.params.domain)
    ? (route.params.domain[0] ?? '')
    : (typeof route.params.domain === 'string' ? route.params.domain : '')
const slug = Array.isArray(route.params.slug)
    ? (route.params.slug[0] ?? '')
    : (typeof route.params.slug === 'string' ? route.params.slug : '')

const { data: pageData } = await useAsyncData<PageContent | null>(
    `page-${domain}-${slug}`,
    async () => {
        if (!domain || !slug) return null
        return await $fetch<PageContent>(`/api/siteMenu/${domain}/${slug}`)
    },
)

const pageContent = computed(() => pageData.value?.content ?? '')
</script>

<template>
    <LayoutUser>
        <UiNav :domain="domain"></UiNav>
        <div class="px-4 py-2 text-sm text-gray-500">
            {{ slug }}
        </div>
        <div v-html="pageContent"></div>
    </LayoutUser>
</template>
