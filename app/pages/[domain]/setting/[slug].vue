<template>
    <LayoutAdmin :site-route-domain="String(domain)">
        <div class="page-shell">
            <UiBreadcrumb :items="[{ label: '頁面管理', to: `/${domain}/setting` }, { label: String(slug) }]" home-link="/dp_index" home-text="後台" />
            <div class="mb-6 mt-5">
                <p class="text-sm font-semibold text-primary-600">{{ domain }}</p>
                <h1 class="mt-1 text-3xl font-black tracking-tight text-slate-950">編輯「{{ slug }}」</h1>
                <p class="mt-2 text-sm text-slate-500">編輯頁面內容，完成後記得儲存變更。</p>
            </div>
            <ClientOnly class="block">
                <div v-if="editor && editorConfig" class="surface-card p-4 sm:p-6">
                    <Ckeditor :editor="editor" v-model="editorData" :config="editorConfig" />
                    <div class="mt-5 flex justify-end">
                        <UiButton :click-function="SaveContent" title="儲存變更" />
                    </div>
                </div>
                <template #fallback>
                    <div class="surface-card p-8 text-center text-sm text-slate-500">編輯器載入中...</div>
                </template>
            </ClientOnly>
        </div>
    </LayoutAdmin>
</template>

<script lang="ts" setup>
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import 'ckeditor5/ckeditor5.css'
import 'ckeditor5-premium-features/ckeditor5-premium-features.css'

interface PageContent {
    id: number,
    content?: string | null,
    status?: string | null
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
        return await $fetch<PageContent>(`/api/page/admin/${domain}/${slug}`)
    },
)

watchEffect(() => {
    editorData.value = pageData.value?.content ?? ''
})

function SaveContent() {
    $fetch(`/api/page/admin/${domain}/${slug}`, {
        method: 'PUT',
        body: {
            id: pageData.value?.id,
            content: editorData.value,
            status: pageData.value?.status,
        },
    })
}

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
            uploadUrl: `${baseUrl}/api/file/editor/upload?domain=${domain}&pageId=${pageData.value?.id}`,
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
