<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center"
    :class="overlay ? 'bg-slate-950/35 backdrop-blur-sm' : ''"
  >
    <div class="flex flex-col items-center space-y-4 rounded-2xl bg-white p-6 shadow-soft ring-1 ring-slate-200">
      <!-- 旋轉圓圈 -->
      <div class="relative">
        <div
          class="animate-spin rounded-full border-4 border-slate-200"
          :class="sizeClasses"
          :style="{ borderTopColor: color }"
        ></div>
      </div>
      <!-- 載入文字 -->
      <p v-if="text" class="text-sm font-medium text-slate-600">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show?: boolean
  text?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: true,
  text: '載入中...',
  size: 'md',
  color: '#3b82f6',
  overlay: true,
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }
  return sizes[props.size]
})
</script>
