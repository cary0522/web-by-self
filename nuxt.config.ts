// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
  ],

  // 後端設定
  nitro: {
    experimental: {
      database: false,
    },
    externals: {
      external: ['@prisma/client', '.prisma/client'],
    },
  },
})
