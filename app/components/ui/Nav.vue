<script setup lang="ts">
interface NavType {
    id: number,
    name: string,
    slug: string,
    viewTypeId: number,
}

const props = defineProps<{ domain: string | '' }>()
const routeDomain = computed(() => props.domain.replace(/^\/+/, ''))
const normalizeSlug = (value: string) => value.startsWith('/') ? value : `/${value}`

const NavList = ref<NavType[]>([])
async function GetNavList() {
    const navList = await $fetch<NavType[]>(`/api/site/${props.domain}`)
    NavList.value = navList
}

onMounted(() => {
    GetNavList()
})
</script>

<template>
    <div class="w-full h-[60px] bg-blue-400 flex items-center">
        <NuxtLink v-for="nav in NavList" :key="nav.id" :to="`/${routeDomain}${normalizeSlug(nav.slug)}`"
            class="my-2 ms-2 hover:text-black hover:underline hover:scale-105 transition-all">{{ nav.name }}</NuxtLink>

    </div>
</template>