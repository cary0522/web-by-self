// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/style.css'],

  runtimeConfig: {
    // 僅伺服器端可讀取，對應環境變數 NUXT_JWT_SECRET
    jwtSecret: '',
    public: {
      siteUrl: '',
    },
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxt/eslint',
  ],

  // 後端設定
  nitro: {
    experimental: {
      database: false,
      openAPI: true,
    },
    externals: {
      external: ['@prisma/client', '.prisma/client'],
    },
  },
})
