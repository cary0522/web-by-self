<script lang="ts" setup>
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import 'ckeditor5/ckeditor5.css'
import 'ckeditor5-premium-features/ckeditor5-premium-features.css'

interface PageContent {
    content?: string | null
}

const route = useRoute()
const domain = route.params.domain || ''
const slug = route.params.slug || ''
const editor = shallowRef<any>(null)
const editorConfig = shallowRef<Record<string, any> | null>(null)
const editorData = ref('')

const runtimeConfig = useRuntimeConfig()
const baseUrl = runtimeConfig.public.siteUrl || useRequestURL().origin

const { data: pageData } = await useAsyncData<PageContent | null>(
    `setting-page-${domain}-${slug}`,
    async () => {
        if (!domain || !slug) return null
        return await $fetch<PageContent>(`/api/siteMenu/${domain}/${slug}`)
    },
)

watchEffect(() => {
    editorData.value = pageData.value?.content ?? ''
})

onMounted(async () => {
    const ck = await import('ckeditor5')
    const coreTranslations = (await import('ckeditor5/translations/zh.js')).default
    const premiumFeaturesTranslations = (await import('ckeditor5-premium-features/translations/zh.js')).default

    editor.value = ck.ClassicEditor
    editorConfig.value = {
        licenseKey: 'GPL',
        plugins: [
            ck.Bold,
            ck.Essentials,
            ck.Italic,
            ck.Mention,
            ck.Paragraph,
            ck.Undo,
            ck.Font,
            ck.Alignment,
            ck.AutoLink,
            ck.Link,
            ck.List,
            ck.ListUI,
            ck.Table,
            ck.TableToolbar,
            ck.Indent,
            ck.IndentBlock,
            ck.MediaEmbed,
            ck.SimpleUploadAdapter,
            ck.Image,
            ck.ImageCaption,
            ck.ImageResize,
            ck.ImageStyle,
            ck.ImageToolbar,
            ck.LinkImage,
            ck.ImageInsert,
        ],
        toolbar: {
            items: [
                'undo',
                'redo',
                '|',
                'bold',
                'italic',
                'fontSize',
                'fontFamily',
                'fontColor',
                'fontBackgroundColor',
                '|',
                'alignment',
                'bulletedList',
                'numberedList',
                'outdent',
                'indent',
                'link',
                'insertTable',
                'mediaEmbed',
                'imageInsert',
            ],
            shouldNotGroupWhenFull: false,
        },
        list: {
            properties: {
                styles: true,
                startIndex: true,
                reversed: true,
            },
        },
        table: {
            defaultHeadings: { rows: 1, columns: 1 },
        },
        translations: [coreTranslations, premiumFeaturesTranslations],
        mediaEmbed: {
            previewsInData: true,
        },
        simpleUpload: {
            uploadUrl: `${baseUrl}/api/upload/file`,
            withCredentials: true,
        },
        image: {
            toolbar: [
                'imageStyle:block',
                'imageStyle:side',
                '|',
                'toggleImageCaption',
                'imageTextAlternative',
                '|',
                'linkImage',
            ],
            insert: {
                type: 'auto' as const,
                integrations: ['upload', 'assetManager', 'url'],
            },
        },
    }
})
</script>

<template>
    <LayoutAdmin :siteRouteDomain="String(domain)">
        <div class="wrap">
            <div class="px-4 py-2 text-sm text-gray-500">
                {{ domain }} / {{ slug }}
            </div>
            <ClientOnly>
                <Ckeditor v-if="editor && editorConfig" :editor="editor" v-model="editorData" :config="editorConfig" />
                <template #fallback>
                    <div class="p-4 text-sm text-gray-500">編輯器載入中...</div>
                </template>
            </ClientOnly>
        </div>
    </LayoutAdmin>
</template>
