<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol class="inline-flex items-center space-x-1 md:space-x-2">
      <!-- 首頁 -->
      <li v-if="showHome" class="inline-flex items-center">
        <NuxtLink
          :to="homeLink"
          class="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
          </svg>
          {{ homeText }}
        </NuxtLink>
      </li>

      <!-- 麵包屑項目 -->
      <li v-for="(item, index) in items" :key="index" class="inline-flex items-center">
        <!-- 分隔符 -->
        <svg
          class="w-5 h-5 text-gray-400 mx-1"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          ></path>
        </svg>

        <!-- 連結或文字 -->
        <NuxtLink
          v-if="item.to && index !== items.length - 1"
          :to="item.to"
          class="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          {{ item.label }}
        </NuxtLink>
        <span
          v-else
          class="text-sm font-medium"
          :class="index === items.length - 1 ? 'text-gray-900' : 'text-gray-500'"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
export interface BreadcrumbItem {
  label: string
  to?: string
}

interface Props {
  items: BreadcrumbItem[]
  showHome?: boolean
  homeText?: string
  homeLink?: string
}

withDefaults(defineProps<Props>(), {
  showHome: true,
  homeText: '首頁',
  homeLink: '/',
})
</script>
