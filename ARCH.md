# Classroom Wordle — 架构说明文档

> 基于 PRD v6.1，反映当前实际代码结构（2026-03-25）

---

## 一、技术栈

| 层级 | 选型 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | React | 18.2 | 函数式组件 + Hooks |
| 构建工具 | Vite | 5.x | 开发服务器 & 生产打包 |
| 样式 | Tailwind CSS | 3.x | Utility-first，配合自定义 CSS 动画 |
| 后端存储 | Supabase | JS SDK 2.x | PostgreSQL + RLS，存储词库数据 |
| 运行时状态 | React useState / useRef | — | 组件级状态管理，无全局 store |
| 游戏进度持久化 | sessionStorage | — | 刷新恢复，关闭标签页后清除 |
| 部署 | Vercel（计划中）/ 本地 npm run dev | — | 静态前端直接部署 |

---

## 二、目录结构

```
classroom-wordle/
├── index.html                  # HTML 入口，设置 viewport、lang="zh"
├── vite.config.js              # Vite 配置，server.host=true 开启局域网访问
├── tailwind.config.js          # Tailwind 内容扫描路径
├── postcss.config.js           # PostCSS 插件配置
├── package.json
├── supabase-setup.sql          # 首次部署时在 Supabase SQL Editor 执行的建表脚本
├── PRD.md                      # 产品需求文档（v6.1）
├── ARCH.md                     # 本文档
├── project_state.md            # 项目当前状态记录
│
├── src/
│   ├── main.jsx                # React 根节点挂载
│   ├── index.css               # Tailwind 指令 + 自定义动画（flip / shake / bounce-in）
│   │
│   ├── lib/
│   │   ├── supabase.js         # Supabase 客户端初始化（当前凭证硬编码，见§五）
│   │   └── gameUtils.js        # 纯函数游戏逻辑工具库（见§四）
│   │
│   └── components/
│       ├── App.jsx                  # 顶层路由：welcome ↔ game 视图切换；加载词库；冷启动内置词库
│       ├── WelcomeModal.jsx         # 欢迎页：展示当前词库、开始游戏、使用说明入口
│       ├── WordBankSelector.jsx     # 词库选择弹窗：列表 + 上传入口 + 删除
│       ├── WordBankUploader.jsx     # 词库上传表单：文本框解析、校验、写入 Supabase
│       ├── DeleteConfirmModal.jsx   # 删除确认弹窗
│       ├── HelpModal.jsx            # 使用说明弹窗
│       ├── GamePage.jsx             # 游戏核心页：状态机、键盘监听、动画调度、sessionStorage
│       ├── GameHeader.jsx           # 顶部栏：进度（X/5）、词库名、提示按钮、返回首页
│       ├── Grid.jsx                 # 动态猜词网格：翻转动画、抖动动画、颜色渲染
│       ├── Keyboard.jsx             # 虚拟 QWERTY 键盘：输入 + 字母颜色状态
│       ├── ResultModal.jsx          # 单词结算弹窗：回答正确 / 答案揭示 + 下一个按钮
│       └── SessionEndScreen.jsx     # 5 词完成庆祝界面：再来一局 / 返回首页
│
└── dist/                       # 生产构建产物（git 忽略）
```

---

## 三、Supabase 数据表结构

在 Supabase 项目 `fzsxpuxlmvyznlvthpad` 中，建表脚本见 `supabase-setup.sql`。

### 表 `word_banks`（词库表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `uuid` PK | `gen_random_uuid()` 自动生成 |
| `name` | `text` | 词库名称（默认上传日期，可自定义） |
| `uploader` | `text` | 上传者昵称（默认"匿名老师"） |
| `created_at` | `timestamptz` | 上传时间，用于列表倒序排列 |

### 表 `words`（单词表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `uuid` PK | 自动生成 |
| `bank_id` | `uuid` FK → `word_banks.id` | 级联删除（删词库时自动删单词） |
| `word` | `text` | 英文单词（大写存储） |
| `hint` | `text` nullable | 提示内容（原样存储，不解析） |
| `letter_count` | `integer` | 字母数（冗余字段，加速 4-8 字母过滤） |

### RLS 策略

所有表启用 Row Level Security，策略为**匿名公开读写删**（无登录要求），适合校内信任环境。

---

## 四、核心状态管理

### 4.1 顶层（App.jsx）

| 状态 | 类型 | 说明 |
|------|------|------|
| `view` | `'welcome' \| 'game'` | 当前显示哪个视图 |
| `banks` | `WordBank[]` | 从 Supabase 加载的所有词库列表 |
| `selectedBank` | `WordBank \| null` | 当前选中的词库 |
| `loadError` | `string \| null` | 词库加载失败的错误信息 |
| `gameInitData` | `object \| null` | 传给 GamePage 的初始化数据 |

### 4.2 游戏层（GamePage.jsx）

所有游戏状态集中在一个 `state` 对象，通过 `setState` 整体更新：

| 字段 | 类型 | 说明 |
|------|------|------|
| `fullWordList` | `Word[]` | 词库中所有 4-8 字母有效词（游戏开始时深拷贝，之后不再请求网络） |
| `usedWords` | `string[]` | 已出现过的单词集合（不放回抽取用） |
| `sessionWords` | `Word[]` | 本轮 5 个词（Fisher-Yates 抽取，按长度升序） |
| `currentWordIndex` | `number` | 当前是第几个词（0-4） |
| `guesses` | `{guess, colors}[]` | 当前词已提交的猜测历史 |
| `currentGuess` | `string` | 正在输入的字母串（即时大写） |
| `isHintRevealed` | `boolean` | 提示内容是否显示（默认 false） |
| `wordStatus` | `'PLAYING' \| 'WON' \| 'LOST'` | 当前词状态 |
| `keyboardColors` | `Record<string, color>` | 虚拟键盘各字母的颜色（优先级：绿>黄>灰） |
| `cellColors` | `Record<string, color>` | 动画过程中逐格写入的颜色（key: `${row}-${col}`） |

另有独立 UI 状态：`isAnimating`、`showResult`、`nextEnabled`、`shakingRow`、`revealingRow`、`showSessionEnd`。

### 4.3 持久化（sessionStorage）

key: `classroomWordle_gameState`

游戏开始时将 `fullWordList` 深拷贝到 sessionStorage，此后所有抽词、再来一局等操作只依赖本地缓存，**与 Supabase 完全解耦**，确保课堂中网络中断不影响游戏。

页面刷新时优先从 sessionStorage 恢复状态，无需重新选择词库。

### 4.4 纯函数工具库（gameUtils.js）

| 函数 | 说明 |
|------|------|
| `cleanWord(raw)` | 去除零宽字符、全角字母转 ASCII、仅保留 A-Z，返回大写或 null |
| `parseWordList(text)` | 解析 textarea 文本，支持逗号/中文逗号/Tab 分隔，返回有效词列表和无效行号 |
| `fisherYatesShuffle(arr)` | 标准 Fisher-Yates 洗牌 |
| `drawSessionWords(fullWordList, usedWords)` | 抽取 5 词：不放回、最多 3 个长词、按长度升序排列、防死锁 |
| `getMaxGuesses(letterCount)` | 4-6 字母返回 L+1，7-8 字母返回 7 |
| `evaluateGuess(guess, target)` | 宽松版 Wordle 算法（不消耗字母，同字母全部标黄） |
| `updateKeyboardColors(prev, guess, colors)` | 按优先级（绿>黄>灰）更新键盘颜色，不降级 |
| `getTodayDate()` | 返回 `YYYY-MM-DD` 字符串 |

---

## 五、环境变量配置说明

### 当前状态

Supabase 凭证**硬编码**在 `src/lib/supabase.js`：

```js
const SUPABASE_URL = 'https://fzsxpuxlmvyznlvthpad.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGci...'
```

Anon Key 是**公开安全**的（Supabase 设计如此，前端可见），数据安全由 RLS 策略控制。因此当前硬编码方式对于此项目是可接受的。

### 推荐做法（如需规范化）

1. 创建 `.env` 文件（已加入 `.gitignore`）：
   ```
   VITE_SUPABASE_URL=https://fzsxpuxlmvyznlvthpad.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```

2. 修改 `src/lib/supabase.js`：
   ```js
   import { createClient } from '@supabase/supabase-js'
   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   )
   ```

3. Vercel 部署时在项目 Settings → Environment Variables 中填入相同的 key-value。

---

## 六、关键设计决策记录

| 决策 | 原因 |
|------|------|
| 宽松版 Wordle 颜色算法（不消耗字母） | 降低中学生认知负担，避免"同字母一黄一灰"造成课堂讨论混乱 |
| 游戏开始后断开 Supabase 依赖 | 学校网络可能不稳定，确保课堂中途不中断 |
| sessionStorage 而非 localStorage | 关闭标签页自动清除，不影响下次课；刷新/闪退可恢复 |
| 不做词典校验 | 减少网络依赖，老师定义的词库即权威来源 |
| 4-8 字母限制 | 手机竖屏 8 列不溢出；超过 8 列在投影仪上也影响可读性 |
| 100dvh + 100vh fallback | 兼容 Safari/微信浏览器地址栏遮挡底部键盘 |
