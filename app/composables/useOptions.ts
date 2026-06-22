import type { ViewType } from '~/types/view-type'

export default function useOption() {
    const ViewTypeList = ref<ViewType[]>([])
    async function GetViewTypeList() {
        const res = await $fetch('/api/viewtype/get-option')
        ViewTypeList.value = res as ViewType[]
    }
    return {
        ViewTypeList,
        GetViewTypeList
    }
}