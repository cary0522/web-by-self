import type { SiteMenu } from '~/types/site-menu'

export default function useSiteData() {
    const router = useRouter()
    // 網站資料
    const siteData = ref({
        id: 0,
        name: '',
        domain: '',
    })
    // 所有頁籤資料
    const siteMenuList = ref<SiteMenu[]>([])
    // 取得網站資訊
    async function GetSiteData() {
        try {
            const res = await $fetch<{ id: number, name: string, domain: string } | null>('/api/site')
            if (res) {
                siteData.value.name = res.name
                siteData.value.domain = res.domain
                siteData.value.id = res.id
                // 取得網站的頁籤資訊
                const menuRes = await $fetch<SiteMenu[]>(`/api/siteMenu/${res.id}`)
                siteMenuList.value = menuRes
            } else {
                siteData.value.name = ''
                siteData.value.domain = ''
                siteData.value.id = 0
            }
        }
        catch (err: any) {
            if (err.data?.statusCode === 401) {
                router.push('/user/login')
            }
        }
    }
    return {
        siteData,
        siteMenuList,
        GetSiteData
    }
}