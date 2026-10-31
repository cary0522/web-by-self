# 功能盤點文件

> 盤點日期：2026-10-31
> 專案：web-by-self（Nuxt 4 + Prisma + MySQL/MariaDB 多站台 CMS）

## 1. 專案定位概述

這是一套「多租戶網站建置／內容管理系統」（類似簡化版 CMS / 架站平台）：

- 一個使用者（User）可建立多個網站（Site），每個網站用唯一 domain 識別。
- 每個 Site 下有多層級的導覽選單（SiteMenu），可對應到「頁面（Page）」「外部連結」「PDF」或「父層選單」。
- Page 內容由可排序、可啟用/停用的區塊（PageSection）組成，支援文字、表格、輪播圖、公告等型態，採 JSON（bodyJson）儲存彈性內容。
- 另有獨立的檔案管理（File）與公告（Announcement）模組。
- 前台（User 版型）依 domain 動態渲染網站內容；後台（Admin 版型）提供網站/選單/頁面/區塊的管理介面。

核心技術棧：Nuxt 4（Vue 3 + Nitro）、Prisma 7（MySQL/MariaDB）、Pinia（含持久化）、Tailwind CSS、JWT + Cookie 驗證、CKEditor 5、SweetAlert2、vue3-carousel。

---

## 2. 已實作內容盤點

### 2.1 資料模型（prisma/schema.prisma）
- `User`：帳號、密碼（bcrypt）、Email、角色（role，1=Admin）、isActive 停權機制。
- `Site`：網站基本資料，含 domain 唯一值、建立者關聯。
- `SiteMenu`：多層選單（parentId 自關聯）、viewType（home/page/pdf/parent/external）、slug 唯一（含 activeSlug 軟刪除後可重用 slug 的機制）、sortOrder、isEnabled、URL/target（外部連結）。
- `Page`：頁面內容主體，含 status（發布狀態）、封存（archivedAt/archivedBy）、建立者/更新者追蹤。
- `PageSection`：頁面內的可排序區塊，type + bodyJson（JSON）彈性結構，isEnabled 控制前台顯示。
- `File` / `PageFile`：檔案集中管理 + 檔案與頁面/區塊引用關係表（usage 欄位），支援軟刪除、sha256 去重判斷、公開/私有旗標。
- `Announcement`：公告資料，含發布/到期時間、軟刪除。
- `ViewType`：選單可用的畫面類型字典表。

整體資料模型考量了軟刪除、稽核欄位（createdBy/updatedBy/deletedBy）、唯一性約束（如 `[siteId, activeSlug]`），設計成熟度偏高。

### 2.2 後端 API（server/api）
| 模組 | 端點 | 功能 |
|---|---|---|
| 認證 | `auth/login`、`auth/logout`、`auth/register` | 註冊、登入（JWT 寫入 cookie）、登出 |
| 網站 | `site/create`、`site/list`、`site/[domain]`（GET）、`site/update` | 建立/列出/查詢/更新網站 |
| 選單 | `siteMenu/create`、`update`、`delete`、`restore`、`deleted`、`[domain]`、`[id]`、`admin/[domain]` | 選單 CRUD、軟刪除與還原、依網域查詢 |
| 頁面 | `page/[domain]/[slug]`（公開）、`page/admin/[domain]/[slug]`（管理，含 PUT） | 前台/後台頁面內容讀寫 |
| 區塊 | 透過 `server/utils/section.ts` + page 相關 API 支援區塊 CRUD（詳見 docs/add-homepage-section.md 規劃） | 首頁區塊管理 |
| 檔案 | `file/upload`、`[id]`（GET/DELETE）、`content/[id]`、`download/[id]`、`editor/upload`、`preview/[id]`、`site/[siteId]` | 上傳、下載、預覽、刪除、還原、依站台列出檔案；CKEditor 圖片上傳整合 |
| 公告 | `announcement/[domain]`、`admin/[id]`（PUT/DELETE） | 公告的前台讀取與後台管理 |
| 畫面類型 | `viewtype/get-option` | 取得可用的 ViewType 選項 |
| 其他 | `check.get.ts` | 健康檢查 |

後端共用邏輯集中在 `server/utils/`（auth.ts、jwt.ts、site.ts、site-menu.ts、page.ts、section.ts、file.ts、upload.ts、announcement.ts、ownership.ts、login-rate-limit.ts），具備：
- JWT 驗證 + 重新查詢 DB 角色（避免 token 過時）、isActive 停權檢查。
- 登入頻率限制（login-rate-limit.ts）。
- Ownership 檢查工具（避免跨站台存取）。
- Server plugin：`migrate-legacy-uploads.ts`（舊檔案遷移）、`validate-runtime-config.ts`（啟動時驗證環境變數）。

### 2.3 前端頁面與元件（app/）
- 版型：`layout/Admin.vue`（後台側邊欄選單、依 viewType 分流）、`layout/User.vue`（前台）。
- 後台頁面：`pages/dp_index.vue`（網站列表/建立/頁籤管理儀表板）、`pages/[domain]/setting/index.vue`（首頁區塊管理，JSON 編輯方式）、`pages/[domain]/setting/[slug].vue`。
- 前台頁面：`pages/[domain]/index.vue`（首頁，依區塊型態渲染）、`pages/[domain]/[slug].vue`（一般頁面）。
- 使用者頁面：`pages/user/login.vue`、`register.vue`。
- UI 元件庫：`AreaTitle`、`Breadcrumb`、`Button`、`ImageCarousel`、`Loading`、`Nav`、`SiteMenu`、`Table`、`Text`，對應 `page-section-ui-registry.ts` 的區塊型態對照表。
- 共用邏輯：`composables/useSiteData.ts`（網站/選單資料拉取）、`useOptions.ts`、Pinia store `stores/admin.ts`（管理員登入狀態，含持久化）。
- 共享型別/常數：`shared/types/page-section.ts`、`shared/constants/page-section-defaults.ts`、`shared/types/site-menu.ts`、`shared/types/view-type.ts`。

### 2.4 文件與測試
- `docs/add-homepage-section.md`：首頁區塊功能的完整設計規格（資料流、API 契約、驗收清單），屬於**規劃文件**，部分內容已落地、部分仍是指引而非既成事實。
- 測試檔：`server/utils/page-section.test.ts`、`site-domain.test.ts`、`site-menu.test.ts` 存在，但 `package.json` 未見任何測試框架（如 vitest）依賴與 npm script，代表測試**目前無法被執行**（詳見未實作章節）。

---

## 3. 未實作 / 待補強內容

| # | 項目 | 說明 | 嚴重度 |
|---|---|---|---|
| 1 | **測試執行環境缺失** | 已有 `*.test.ts` 檔案，但無 vitest/jest 依賴與 script，測試無法真正執行，等同沒有自動化驗證。 | 高 |
| 2 | **前端路由權限守衛（middleware）缺失** | 專案中找不到 `app/middleware/`，後台頁面僅依賴 API 回傳 401 後才導回登入頁，使用者可直接瀏覽後台畫面短暫看到空狀態或閃爍，且 SSR 下可能短暫洩漏畫面結構。 | 高 |
| 3 | **首頁區塊管理 UI 過於原始** | `setting/index.vue` 目前以「JSON textarea」直接編輯 `bodyJson`，並非 `docs/add-homepage-section.md` 規劃的「四種編輯介面」（文字/表格/輪播圖/公告各自的表單元件）。對非技術管理者不友善，容易因 JSON 格式錯誤造成資料毀損。 | 高 |
| 4 | **一般頁面（page/pdf viewType）編輯介面** | 目前看到的管理介面聚焦在首頁（home）區塊，一般頁面與 PDF 類型頁籤的內容編輯/上傳流程尚未在前端完整串接（CKEditor 整合程度待確認）。 | 中 |
| 5 | **角色與權限管理** | `User.role` 僅有 Admin(1) 一種角色觀念，無多角色（如一般使用者、網站擁有者、編輯者）區分與設定介面；多租戶情境下「使用者只能管理自己建立的 Site」的所有權檢查雖有 `ownership.ts`，但前端未見對應的使用者-網站權限管理頁面。 | 中 |
| 6 | **公告（Announcement）後台 UI** | 有公告 API（CRUD），但未發現對應的後台管理頁面（Vue 元件），僅能透過 API 操作。 | 中 |
| 7 | **檔案管理後台 UI** | 檔案上傳/下載/預覽 API 齊全，但缺少一個「檔案總管」式的後台頁面（列表、搜尋、刪除、重新命名、公開/私有切換）。 | 中 |
| 8 | **SEO／多站台網域路由策略** | 目前前台路由採 `/[domain]/...` 路徑參數方式，而非真實多網域（如 `a.com` vs `b.com`）綁定；若產品目標是獨立網域各自架站，需要額外的 Nitro/反向代理層網域解析與快取策略。 | 中 |
| 9 | **錯誤處理與空狀態一致性** | API 錯誤碼語意在文件中有規範（400/401/404/422），但實際端點是否全數遵循一致尚待覆核（例如部分可能統一回 400 而非 422）。 | 低 |
| 10 | **國際化（i18n）** | 目前文字皆為中文硬編碼，未見 `@nuxtjs/i18n` 或語系切換機制。 | 低 |
| 11 | **稽核紀錄／操作日誌** | 雖有 createdBy/updatedBy/deletedBy 欄位，但無操作歷程（Audit Log）查詢介面，無法追蹤「誰在何時改了什麼」。 | 低 |
| 12 | **CI/CD、Lint 自動化** | 有 eslint 設定與 script，但未見 GitHub Actions 等 CI 設定檔，PR 時品質把關仰賴人工執行。 | 低 |
| 13 | **檔案容量與安全限制** | 上傳 API 存在，但是否有檔案大小/類型白名單、防病毒掃描、rate limit 等防護需進一步確認強化。 | 中 |
| 14 | **首頁區塊「真正刪除」與排序 API** | 依 `docs/add-homepage-section.md` 驗收清單，刪除與排序持久化等細節仍標示為待完成項目，需要與現有程式碼逐一核對落地狀態。 | 中 |

---

## 4. 優先度與建議實作順序

### P0（立即處理，風險最高）
1. **補上前端路由權限守衛**：新增 `app/middleware/auth.global.ts`（或具名 middleware），在進入 `[domain]/setting/**`、`dp_index.vue` 前檢查 Pinia `isLoggedIn`/呼叫 `/api/check`，避免未登入狀態下畫面閃爍或誤觸操作。
2. **建立測試執行環境**：安裝 `vitest` + 設定 `vitest.config.ts`，把既有 `*.test.ts` 跑起來並納入 `npm run test` script，優先覆蓋 `site-domain`、`site-menu`、`page-section` 的核心邏輯。

### P1（影響使用者體驗與資料安全）
3. **首頁區塊編輯 UI 正規化**：依 registry 分別實作文字/表格/輪播圖/公告四種可視化表單元件，取代目前的 JSON textarea，降低誤操作風險。
4. **一般頁面（page/pdf）管理流程補齊**：確認 CKEditor 整合與頁面發布狀態切換、PDF 上傳流程在前端是否可用，補齊缺口。
5. **上傳安全性強化**：檔案類型白名單、大小限制、病毒掃描（或至少 MIME 校驗，`file-type` 套件已存在可利用）。

### P2（管理效率與平台完整度）
6. **公告管理後台頁面**：串接既有 API，提供列表、新增、編輯、下架 UI。
7. **檔案總管頁面**：提供跨頁面的檔案瀏覽、搜尋、刪除、公開狀態切換。
8. **角色與權限頁面**：至少支援「網站擁有者」與「編輯者」兩種角色區分，並有對應的使用者管理後台。

### P3（長期優化）
9. **多網域綁定策略評估**：若需真正獨立網域，規劃 Nitro 層或反向代理的網域解析方案。
10. **國際化（i18n）**：視市場需求決定是否導入。
11. **稽核紀錄查詢頁面**：將既有稽核欄位可視化，提供後台查詢介面。
12. **CI/CD 建置**：加入 GitHub Actions，在 PR 時自動跑 lint + typecheck + test。

---

## 5. 最終整體架構建議

### 5.1 分層架構（維持現有 Nuxt 全端一體設計，強化分工）

```
┌─────────────────────────────────────────────────────────────┐
│ Presentation Layer (app/)                                     │
│  ├─ Admin UI（layout/Admin.vue + pages/[domain]/setting/**）   │
│  ├─ Public UI（layout/User.vue + pages/[domain]/**）           │
│  ├─ Shared UI Components（components/ui/**，依 registry 分流） │
│  └─ Route Guards（middleware/，待新增）                        │
├─────────────────────────────────────────────────────────────┤
│ State / Composable Layer                                       │
│  ├─ Pinia Stores（admin.ts，必要時拆分 site.ts, user.ts）       │
│  └─ Composables（useSiteData, useOptions, 待新增 useAnnouncement│
│      / useFileManager）                                         │
├─────────────────────────────────────────────────────────────┤
│ Shared Contract Layer (app/shared/)                            │
│  └─ 型別、常數、跨前後端共用的 Body Schema（已建立雛形，建議    │
│      擴充為 zod schema 做 runtime 驗證）                        │
├─────────────────────────────────────────────────────────────┤
│ API Layer (server/api/)                                        │
│  └─ 依資源分模組（auth / site / siteMenu / page / announcement │
│      / file / viewtype），統一走 defineRouteMeta 做 OpenAPI     │
├─────────────────────────────────────────────────────────────┤
│ Domain / Utility Layer (server/utils/)                          │
│  └─ 封裝 Prisma 操作、權限檢查（ownership.ts）、驗證、速率限制   │
├─────────────────────────────────────────────────────────────┤
│ Data Layer (prisma/)                                            │
│  └─ MySQL/MariaDB + Prisma Client，已有良好的軟刪除/稽核欄位設計 │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 建議強化方向

1. **Schema 驗證一致化**：在 `app/shared/types/page-section.ts` 之上導入 `zod`，前後端共用同一組 runtime schema，取代目前以 TypeScript type 為主、JSON textarea 手動輸入的作法，同時可自動產生表單欄位定義（降低第 3 點 UI 開發成本）。
2. **權限模型往 RBAC 擴展**：將 `User.role`（目前只有數字 1=Admin）擴充為角色表（Role / Permission），搭配 Site 層級的「擁有者/協作者」關聯表，支援多人協作管理同一網站的情境。
3. **API 錯誤語意與回應格式統一**：建立共用的 `server/utils/http-error.ts`，統一 400/401/403/404/422 的使用情境與回應結構，避免各端點各自為政。
4. **前端狀態管理分流**：隨功能增加，建議把 `stores/admin.ts` 拆分為 `stores/auth.ts`（登入態）與 `stores/site.ts`（目前選取的網站/選單狀態），避免單一 store 過度肥大。
5. **檔案與內容解耦強化**：`PageFile` 已設計了 usage 欄位，建議在前端補上對應的「素材庫」選擇器 UI，減少區塊內容直接寫入檔案 URL 字串的耦合。
6. **可觀測性**：加入基本的 server log（如 pino）與全域錯誤處理 plugin，方便追蹤 production 問題；搭配第 11 點稽核紀錄查詢頁面，形成完整的維運可視性。
7. **測試金字塔**：單元測試（server/utils 純函式）→ API 整合測試（supertest 或 Nitro test utils）→ 關鍵頁面 E2E（Playwright），優先把現有 `*.test.ts` 接上 CI，再逐步往上補。
8. **多網域路由**：若確定要支援真實多網域，建議在 Nitro 層加入 domain → site 的中介層解析快取（Redis 或記憶體 LRU），避免每次請求都查 DB 比對 domain。

---

## 6. 總結

此專案已具備扎實的資料模型與 API 骨架（多站台、分層選單、彈性區塊、檔案與公告模組皆有雛形），後端設計成熟度高於前端。最大的落差在於：

- **管理介面的易用性**（JSON 編輯區塊、缺少公告/檔案後台 UI）
- **基礎防護機制**（路由守衛、測試執行環境）

建議依本文件第 4 節的 P0 → P3 順序推進，可在風險可控的前提下，逐步把現有良好的後端設計轉化為完整可用的產品。
