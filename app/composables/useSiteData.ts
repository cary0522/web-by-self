import type { SiteMenu } from '~/shared/types/site-menu'

export default function useSiteData() {
    const router = useRouter()
    // 網站資料
    const siteData = ref({
        id: 0,
        name: '',
        domain: '',
    })
    const siteList = ref<Array<{ id: number, name: string, domain: string }>>([])
    // 所有頁籤資料
    const siteMenuList = ref<SiteMenu[]>([])
    // 取得網站資訊
    async function GetSiteData() {
        try {
            const sites = await $fetch<Array<{ id: number, name: string, domain: string }>>('/api/site/list')
            siteList.value = sites
            const res = sites.find(site => site.id === siteData.value.id) ?? sites[0] ?? null
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
    async function SelectSite(siteId: number) {
        const site = siteList.value.find(item => item.id === siteId)
        if (!site) return
        Object.assign(siteData.value, site)
        siteMenuList.value = await $fetch<SiteMenu[]>(`/api/siteMenu/${site.id}`)
    }
    return {
        siteData,
        siteList,
        siteMenuList,
        GetSiteData,
        SelectSite,
    }
}
