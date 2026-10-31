<template>
    <button
        :type="props.type"
        :disabled="props.disabled"
        :class="variantClasses"
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition duration-150 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px"
        @click="props.clickFunction"
    >
        {{ props.title }}
    </button>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    title: string,
    clickFunction?: () => void,
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
    type?: 'button' | 'submit' | 'reset',
    disabled?: boolean,
}>(), {
    variant: 'primary',
    type: 'button',
    disabled: false,
    clickFunction: () => undefined,
})

const variantClasses = computed(() => ({
    primary: 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700',
    danger: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100',
    ghost: 'bg-transparent text-slate-600 shadow-none hover:bg-slate-100 hover:text-slate-900',
}[props.variant]))
</script>
