<script setup lang="ts">
import { ref } from 'vue';
// 取得這個網站的資料
// 網站資料:增刪修查api
// 有網站資料之後，才能取得這個使用者所有後台頁籤
// 頁籤:增刪修查api

const SiteName = ref('')
const SiteMenuData = ref({
    Name: '',
    Slug: '',
    ViewType: '',
})
const SiteMenuList = ref([
    {
        Name: '',
        Slug: '',
        ViewType: '',
    },
])

</script>

<template>
    <div class="h-screen">
        <h1 class="text-4xl font-bold w-full">管理者後台</h1>
        <div class="w-full px-2 flex">
            <div class="w-1/6 border min-h-screen">選單</div>
            <div class="grow border min-h-screen">
                <div>
                    <h3>
                        網站管理
                    </h3>
                    <input type="text" v-model="SiteName" placeholder="網站名稱" class="border p-1" />
                </div>
                <div>
                    <h3>
                        頁籤管理
                    </h3>
                    <div v-for="menu in SiteMenuList" :key="menu.Slug" class="flex items-center">
                        <p>{{ menu.Name }}</p>
                        <p>{{ menu.Slug }}</p>
                        <p>{{ menu.ViewType }}</p>
                    </div>
                    <input type="text" v-model="SiteMenuData.Name" placeholder="頁籤名稱" class="border p-1" />
                    <input type="text" v-model="SiteMenuData.Slug" placeholder="頁籤slug" class="border p-1" />
                    <input type="text" v-model="SiteMenuData.ViewType" placeholder="頁籤view type" class="border p-1" />
                </div>
            </div>
        </div>
    </div>
</template>