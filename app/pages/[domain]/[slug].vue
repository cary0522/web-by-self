<template>
    <LayoutUser>
        <UiNav :domain="domain"></UiNav>
        <div class="page-shell">
            <UiBreadcrumb :items="[{ label: slug }]" :home-link="`/${domain}`" />
            <article class="surface-card mt-6 p-6 sm:p-10">
                <div v-if="pageContent" class="prose-content" v-html="pageContent"></div>
                <div v-else class="py-12 text-center">
                    <p class="font-semibold text-slate-700">此頁面尚無內容</p>
                    <p class="mt-1 text-sm text-slate-500">請稍後再回來看看。</p>
                </div>
            </article>
        </div>
    </LayoutUser>
</template>

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
        return await $fetch<PageContent>(`/api/page/${domain}/${slug}`)
    },
)

const pageContent = computed(() => pageData.value?.content ?? '')
</script>
