<script setup lang="ts">
const props = defineProps<{
    title: string,
    clickFunction: () => void
}>()

</script>
<template>
    <button @click="props.clickFunction" class="bg-blue-500 text-white px-4 py-2 my-2 mx-2 rounded hover:bg-blue-600">{{
        props.title }}</button>
</template>