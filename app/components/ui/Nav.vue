<template>
    <nav class="sticky top-[73px] z-30 border-y border-slate-200/80 bg-white/90 backdrop-blur-xl" aria-label="網站導覽">
        <div class="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
            <template v-for="nav in visibleNavItems" :key="nav.id">
            <a
                v-if="nav.viewType === VIEW_TYPE.EXTERNAL && nav.url"
                :href="nav.url"
                :target="nav.target || '_self'"
                :rel="nav.target === '_blank' ? 'noopener noreferrer' : undefined"
                class="shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-primary-50 hover:text-primary-700"
            >
                {{ nav.name }}
            </a>
            <span v-else-if="nav.viewType === VIEW_TYPE.PARENT"
                class="shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700">
                {{ nav.name }}
            </span>
            <NuxtLink v-else-if="nav.slug" :to="`/${routeDomain}${nav.slug}`"
                class="shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-primary-50 hover:text-primary-700"
                active-class="bg-primary-50 text-primary-700">
                {{ nav.name }}
            </NuxtLink>
            </template>
        </div>
    </nav>
</template>

<script setup lang="ts">
import type { SiteMenu } from '~/shared/types/site-menu'
import { VIEW_TYPE } from '~/utils/enums'

const props = defineProps<{ domain: string | '' }>()
const routeDomain = computed(() => props.domain.replace(/^\/+/, ''))
const navList = ref<SiteMenu[]>([])
const visibleNavItems = computed(() => {
    const flattened: SiteMenu[] = []
    const append = (menus: SiteMenu[]) => {
        for (const menu of menus) {
            flattened.push(menu)
            append(menu.subPage)
        }
    }
    append(navList.value)
    return flattened
})
async function GetNavList() {
    const response = await $fetch<SiteMenu[] | null>(`/api/site/${props.domain}`)
    navList.value = response ?? []
}

onMounted(() => {
    GetNavList()
})
</script>
