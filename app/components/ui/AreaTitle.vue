<template>
    <div class="mb-5 flex w-full items-center gap-3">
        <span class="h-6 w-1 rounded-full bg-primary-500" aria-hidden="true"></span>
        <h2 class="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{{ props.title }}</h2>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    title: string,
}>()

</script>
