<template>
    <LayoutUser>
        <UiNav :domain="domain" />
        <div class="page-shell">
            <div class="mb-8 border-b border-slate-200 pb-6">
                <p class="text-sm font-semibold text-primary-600">{{ domain }}</p>
                <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950">首頁內容</h1>
            </div>
            <div v-if="!pageData?.length" class="surface-card border-dashed px-6 py-16 text-center">
                <p class="font-semibold text-slate-700">尚無內容</p>
                <p class="mt-1 text-sm text-slate-500">網站管理員正在準備精彩內容。</p>
            </div>
            <div v-else class="space-y-6">
                <section v-for="section in pageData" :key="section.id" class="surface-card p-6 sm:p-8">
                    <h2 v-if="section.title" class="mb-4 text-2xl font-bold tracking-tight text-slate-900">{{ section.title }}</h2>
                    <div v-if="section.type === 'richText'" v-html="richTextBody(section).contentHtml"
                        :style="{ textAlign: richTextBody(section).textAlign, maxWidth: richTextBody(section).maxWidth }" />
                    <UiTable v-else-if="section.type === 'table'" :body="tableBody(section)" />
                    <UiImageCarousel v-else-if="section.type === 'carousel'" :body="carouselBody(section)" />
                    <ul v-else class="divide-y divide-slate-100">
                        <li v-for="announcement in announcements.slice(0, announcementBody(section).limit)" :key="announcement.id" class="py-3">
                            <h3 class="font-semibold text-slate-800">{{ announcement.title }}</h3>
                            <time v-if="announcementBody(section).showDate" class="text-xs text-slate-500">
                                {{ new Date(announcement.publishedAt).toLocaleDateString('zh-TW') }}
                            </time>
                            <p v-if="announcement.content" class="mt-1 text-sm text-slate-600">{{ announcement.content }}</p>
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    </LayoutUser>
</template>

<script setup lang="ts">
import type {
    AnnouncementBody,
    CarouselBody,
    PageSection,
    RichTextBody,
    TableBody,
} from '~/shared/types/page-section'

type PublicAnnouncement = { id: number, title: string, content: string | null, publishedAt: string }

const route = useRoute()
const domain = Array.isArray(route.params.domain) ? route.params.domain[0] || '' : String(route.params.domain || '')
const { data: pageData } = await useAsyncData(`page-${domain}-home`, () =>
    $fetch<PageSection[]>(`/api/page/${domain}/home/block`),
)
const { data: announcementData } = await useAsyncData(`announcements-${domain}`, () =>
    $fetch<PublicAnnouncement[]>(`/api/announcement/${domain}?limit=100`),
)
const announcements = computed(() => announcementData.value ?? [])

const richTextBody = (section: PageSection) => section.bodyJson as RichTextBody
const tableBody = (section: PageSection) => section.bodyJson as TableBody
const carouselBody = (section: PageSection) => section.bodyJson as CarouselBody
const announcementBody = (section: PageSection) => section.bodyJson as AnnouncementBody
</script>
