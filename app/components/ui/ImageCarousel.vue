<template>
    <div v-if="body.images.length === 0" class="rounded-xl border border-dashed p-8 text-center text-slate-500">
        尚未提供輪播圖片
    </div>
    <Carousel v-else :autoplay="body.autoplay ? body.interval : 0" :wrap-around="true" :pause-autoplay-on-hover="true">
        <Slide v-for="image in body.images" :key="image.fileId">
            <a :href="image.linkUrl || undefined" class="relative block w-full overflow-hidden rounded-xl">
                <img :src="`/api/file/content/${image.fileId}`" :alt="image.alt || ''" class="h-80 w-full object-cover" />
                <span v-if="image.caption" class="absolute inset-x-0 bottom-0 bg-black/55 px-4 py-3 text-sm text-white">
                    {{ image.caption }}
                </span>
            </a>
        </Slide>
        <template #addons>
            <Navigation v-if="body.showArrows" />
            <Pagination v-if="body.showDots" />
        </template>
    </Carousel>
</template>

<script setup lang="ts">
import { Carousel, Navigation, Pagination, Slide } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'
import type { CarouselBody } from '~/shared/types/page-section'
defineProps<{ body: CarouselBody }>()
</script>
