<script lang="ts" setup>
import Swal from 'sweetalert2'
import UiButton from '~/components/ui/Button.vue'

const route = useRoute()
const slug = route.params?.slug?.[0] || ''
</script>

<template>
    <UiNav :slug="slug"></UiNav>
    {{ slug }}
</template>