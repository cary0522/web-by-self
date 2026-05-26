import { defineStore } from 'pinia'

interface AdminDataType {
    id: number,
    account: string,
    mail?: string,
    name: string,
    role: string,
}

export const useAdminStore = defineStore(
    'admin',
    () => {
        const adminData = ref<AdminDataType>({
            id: 0,
            account: '',
            name: '',
            mail: '',
            role: '',
        })

        const isLoggedIn = ref(false)
        const isAdmin = ref(false)

        // 設定管理員資料
        function setAdminData(data: Partial<AdminDataType>): void {
            Object.assign(adminData.value, data)
        }

        // 清除管理員資料
        function clearAdminData(): void {
            setAdminData({
                id: 0,
                account: '',
                name: '',
                mail: '',
                role: '',
            })
            isLoggedIn.value = false
            isAdmin.value = false
        }

        async function logOut(): Promise<void> {
            try {
                await $fetch('/api/auth/logout', {
                    method: 'POST',
                })
            } finally {
                clearAdminData()
            }
        }

        return { adminData, isLoggedIn, isAdmin, setAdminData, clearAdminData, logOut }
    },
    {
        persist: {
            pick: ['adminData', 'isLoggedIn', 'isAdmin'],
        },
    }
)