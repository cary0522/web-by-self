// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

/**
 * 專案命名規範（Naming Conventions）
 *
 * ┌─────────────────────┬─────────────────┬────────────────────────────────┐
 * │ 類型                │ 規則            │ 範例                           │
 * ├─────────────────────┼─────────────────┼────────────────────────────────┤
 * │ Component 檔案名稱  │ PascalCase      │ UserCard.vue, AdminLayout.vue  │
 * │ Template 元件使用   │ PascalCase      │ <UserCard />, <AdminLayout />  │
 * │ Composable 函式     │ camelCase + use │ useAuth(), useAdminStore()     │
 * │ TS Interface / Type │ PascalCase      │ AdminDataType, UserResponse    │
 * │ Enum 名稱           │ PascalCase      │ UserRole, PageStatus           │
 * │ Enum 成員           │ UPPER_CASE      │ SUPER_ADMIN, PAGE_NOT_FOUND    │
 * │ 變數 / 函式         │ camelCase       │ adminData, setAdminData()      │
 * │ 常數                │ UPPER_CASE      │ MAX_RETRY_COUNT, API_BASE_URL  │
 * │ Template props      │ kebab-case      │ :user-name="...", @on-submit   │
 * │ CSS class           │ kebab-case      │ .user-card, .admin-layout      │
 * │ Page / API 路由檔案 │ kebab-case      │ user-profile.vue, auth/login   │
 * └─────────────────────┴─────────────────┴────────────────────────────────┘
 *
 * 注意：CSS class 命名與 Component 檔案命名需人工遵守，ESLint 無法自動檢查。
 */

export default withNuxt({
  rules: {
    // ── Vue：Template 內元件使用 PascalCase ──────────────────────────────
    'vue/component-name-in-template-casing': ['error', 'PascalCase', {
      registeredComponentsOnly: false,
    }],

    // ── Vue：Template props 使用 kebab-case ──────────────────────────────
    'vue/attribute-hyphenation': ['error', 'always'],

    // ── Vue：emit 事件名稱使用 kebab-case ────────────────────────────────
    'vue/v-on-event-hyphenation': ['error', 'always'],

    // ── TypeScript：變數、函式、型別命名規範 ─────────────────────────────
    '@typescript-eslint/naming-convention': [
      'error',

      // 預設：camelCase
      {
        selector: 'default',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },

      // 變數：camelCase 或 UPPER_CASE（常數）
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },

      // 函式參數：camelCase（允許 _unused 慣例）
      {
        selector: 'parameter',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },

      // Interface / Type / Class / Enum 名稱：PascalCase
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },

      // Enum 成員：UPPER_CASE
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
      },

      // 物件屬性：camelCase 或 UPPER_CASE（允許 snake_case 以相容後端資料）
      {
        selector: 'objectLiteralProperty',
        format: ['camelCase', 'UPPER_CASE', 'snake_case'],
        leadingUnderscore: 'allow',
      },
    ],
  },
})
