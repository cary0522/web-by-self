<script setup lang="ts">
const props = defineProps<{
    title: string,
}>()

</script>
<template>
    <p class="w-full font-bold text-lg my-4 mx-4 hover:underline underline-offset-8">{{
        props.title }}</p>
</template>