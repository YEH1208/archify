# Archify 臺灣正體中文（zh-TW）用詞表

這份文件說明 Archify 介面（`meta.locale: "zh-TW"`）的譯法依據，方便審查，也讓之後修改翻譯的人能沿用同一套標準。介面文字在 `archify/renderers/shared/i18n.mjs`，每句都有英文、簡體中文、臺灣正體中文三個版本。

## 參考來源

| 代號 | 來源 | 用途 |
|---|---|---|
| MS | Microsoft Terminology Collection（臺灣正體中文，2024-11） | 軟體介面術語的主要依據 |
| MSG | Microsoft Chinese (Traditional) Localization Style Guide（2024） | 標點、空格、語氣 |
| NAER | 國家教育研究院「樂詞網」 | 圖論、資料流程、UML 等學術名詞 |
| MOZ | Mozilla zh-TW 在地化風格指南 | 交叉比對格式規則 |

微軟與樂詞網說法不同時，介面操作類用詞以微軟為準（與 Windows、Office 一致），學術名詞以樂詞網為準。

## 格式規則

- 介面裡的冒號、括號用半形：`無法匯出: {message}`、`切換主題 (T)`；中文與半形括號之間空一格。（MSG 4.2.7、4.2.10）
- 中文與英文、數字之間空一個半形空格；全形標點前後不空。（MSG 4.2.10、MOZ）
- 逗號、句號、頓號、引號用全形：，。、「」。
- 不用破折號（—），改用冒號或括號；刪節號用 `...`。（MSG 4.2.7）
- 指示句加「請」；錯誤訊息用「無法…」「找不到…」。（MSG 2.2.1、5.6.2）
- `{label}` 這類會換成使用者文字的變數，前後不另加空格；`{count}` 等數字前後空格並加量詞。（MSG 5.6.2）
- 按鍵名稱 Enter、Esc 不翻；Spacebar 為「空格鍵」，arrow keys 為「方向鍵」。（MSG 5.6.4）

## 用詞

| 英文 | 臺灣正體中文 | 依據 |
|---|---|---|
| node | 節點 | MS |
| relationship | 關聯 | MS |
| link / connection（圖上的線） | 連線 | MS connection |
| link（網址） | 連結 | MS |
| route / path | 路徑 | MS |
| directed | 有向 | MS directed graph＝有向圖；NAER directed edge＝有向邊 |
| hop | 躍點 | MS |
| self loop | 自迴路 | NAER（電子計算機名詞） |
| reachability | 可達性 | NAER |
| upstream / downstream | 上游／下游 | MS |
| shortest path | 最短路徑 | NAER |
| outgoing / incoming | 傳出／傳入 | 介面慣用 |
| export | 匯出 | MS |
| clipboard | 剪貼簿 | MS |
| raster image / image | 點陣影像／影像 | MS |
| vector | 向量 | MS |
| canvas | 畫布 | MS |
| style / visual style | 樣式／視覺樣式 | MS |
| theme | 主題 | MS |
| dark / light | 深色／淺色 | MS |
| legend | 圖例 | MS |
| search / find | 搜尋／尋找 | MS |
| zoom in / zoom out | 放大／縮小 | MS |
| reset | 重設 | MS |
| view | 檢視 | MS |
| presentation | 簡報 | MS |
| animation / motion | 動畫 | MS |
| pin | 釘選 | MS |
| select | 選取 | MS |
| click | 按一下 | MS |
| highlight | 醒目提示 | MS |
| metadata | 中繼資料 | MS |
| source code | 原始程式碼（徽章簡寫為「原始碼」） | MS |
| repository | 儲存庫 | NAER |
| revision | 修訂版本 | — |
| viewport | 檢視區 | MS |
| overview | 概觀 | MS |
| kind | 種類 | MS |
| role | 角色 | MS |
| keyboard shortcut | 鍵盤快速鍵 | MS |
| frontend / backend | 前端／後端 | MS |
| database | 資料庫 | MS |
| cloud / cloud service | 雲端／雲端服務 | MS |
| security | 安全性 | MS |
| policy | 原則 | MS（與 Windows「群組原則」一致） |
| message bus | 訊息匯流排 | — |
| action | 動作 | MS |
| async | 非同步 | MS |
| batch | 批次 | MS |
| data store | 資料存放區 | MS |
| request / return | 要求／傳回 | MS |
| context（agent 用） | 上下文 | MS |
| agent logic | 代理程式邏輯 | MS agent＝代理程式 |
| decision | 決策 | MS |
| waiting | 等待中 | MS |
| destination | 目的地 | MS |
| deep link | 深層連結 | MS |
| annotation / tag / label | 註釋／標記／標籤 | MS |
| preferences | 喜好設定 | MS |
| architecture diagram | 架構圖 | — |
| workflow diagram | 工作流程圖 | MS workflow＝工作流程 |
| sequence diagram | 順序圖 | MS、NAER（「時序圖」為中國大陸用法） |
| data-flow diagram | 資料流程圖 | NAER |
| lifecycle | 生命週期 | MS |
| participant | 參與者 | MS |
| chapter / story | 章節／故事 | MS |

## 需要說明的譯法

| 英文 | 譯法 | 理由 |
|---|---|---|
| authored（authored relationship、authored reach 等） | 作者定義的 | 指由圖的作者寫在規格裡的內容，與系統推算的結果相對。直譯「編寫的」讀者不易理解。 |
| story beat / stop | 步 | 導覽故事的每一步。避免與 node（節點）撞名，也和路徑的「第幾步」一致。 |
| guided views | 導覽 | 臺灣常見說法，比「引導檢視」自然。 |
| Semantic Passport | 節點資訊卡 | 功能名稱改用白話，說明它的用途。 |
| Semantic Lens | 種類比較 | 同上；右下角簡稱「比較」。 |
| Semantic Radar | 全圖縮圖 | 同上；右下角簡稱「縮圖」。 |
| Route Probe | 路徑查詢 | 同上；trace a route 相應譯為「查詢路徑」。 |
| Live / Still（動畫開關） | 動態／靜態 | 比微軟 live＝即時更貼近這裡的意思。 |
| Editorial（視覺樣式） | 筆記 | 樣式名稱描述外觀：米色紙張、橫格線、手寫感標題。「簡報」已用於 Presentation 模式，「播放」已用於故事與路徑播放，故不採用。小標籤 FIELD NOTE 譯為「現場紀錄」。 |
| lifecycle 的 active | 進行中 | 用於業務流程狀態時比「作用中」自然。 |

## 字型

`zh-TW` 頁面的中文優先使用 Noto Sans Mono CJK TC、蘋方-繁、微軟正黑體。「筆記」樣式的標題與卡片標題使用內嵌的霞鶩文楷字形子集（SIL Open Font License 1.1），以免在 Windows 上退回新細明體；授權與出處見 [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md)。

## 資料來源與權利聲明

- 本譯文為貢獻者自行翻譯。微軟臺灣正體中文術語庫與風格指南、國家教育研究院樂詞網、Mozilla 臺灣正體中文風格指南僅用於查證用詞，未複製其內容。
- OpenCC 僅作為轉換工具，產出的文字由人工與 AI（Claude Code）協作審校。
- 「筆記」樣式內嵌的字型為霞鶩文楷的字形子集，依 SIL Open Font License 1.1 使用，授權與出處見 THIRD_PARTY_NOTICES.md。
- 若您認為本專案的任何內容侵害您的權利，請在 [YEH1208/archify 開 issue](https://github.com/YEH1208/archify/issues) 告知，我們會盡快確認並處理。
