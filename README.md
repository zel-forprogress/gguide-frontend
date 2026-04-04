# GGuide Frontend

GGuide Frontend 是项目的前端应用，基于 React、TypeScript 和 Vite 构建，负责展示游戏列表、详情页、收藏、最近浏览、个人设置页，以及与后端接口联调。

## 当前状态

- 技术栈：React 19、TypeScript、Vite、React Router、Axios
- 默认开发地址：`http://127.0.0.1:5173`
- 开发联调方式：Vite `server.proxy`
- 对应后端项目：`D:\code\projects\gguide-backend`

## 功能概览

- 首页推荐、今日推荐、游戏 Hub
- 游戏详情页
- 登录 / 注册页
- 收藏与最近浏览
- 个人设置页
- 中英文切换
- 游客浏览与登录态浏览

## 目录说明

```text
src
├─ components   通用组件
├─ i18n         语言与文案
├─ pages        页面级组件
├─ routes       路由配置与守卫
├─ services     接口请求封装
└─ utils        本地工具方法
```

关键文件：

- [src/routes/index.tsx](D:/code/projects/gguide-frontend/src/routes/index.tsx)
- [src/services/api.ts](D:/code/projects/gguide-frontend/src/services/api.ts)
- [vite.config.ts](D:/code/projects/gguide-frontend/vite.config.ts)

## 路由说明

当前页面路由：

- `/`：首页 / Dashboard
- `/auth`：登录注册页
- `/dashboard`：Dashboard 别名入口
- `/games/:id`：游戏详情页
- `/profile`：个人设置页

其中：

- `/profile` 受登录态保护
- `/auth` 在已登录时会被公共路由守卫拦截

## 运行环境

- Node.js 22+
- npm 10+

当前项目已在 Node `v22.18.0` 下验证过构建通过。

## 安装依赖

```powershell
cd D:\code\projects\gguide-frontend
npm install
```

## 启动前端

```powershell
cd D:\code\projects\gguide-frontend
npm run dev
```

启动后默认访问：

- 开发页：`http://127.0.0.1:5173`

## 构建前端

```powershell
npm run build
```

## 为什么接口地址不写死在代码里

当前前端接口走的是相对路径，比如：

```ts
api.get('/api/games')
```

这样做的原因是：

- 前端代码不需要写死后端地址
- 本地开发由 Vite 代理解决跨域和端口问题
- 切换后端地址时，只需要改环境变量，不需要改业务代码

## Vite 开发代理

开发代理配置在 [vite.config.ts](D:/code/projects/gguide-frontend/vite.config.ts)。

当前逻辑是：

- 前端请求 `/api/**`
- Vite dev server 代理到 `http://localhost:8080`

这就是你熟悉的“开发环境放在 Vite config 里”的方式。

## 与后端联调

先启动后端：

```powershell
cd D:\code\projects\gguide-backend
mvn spring-boot:run
```

再启动前端：

```powershell
cd D:\code\projects\gguide-frontend
npm run dev
```

联调默认约定：

- 前端：`http://127.0.0.1:5173`
- 后端：`http://localhost:8080`
- 代理目标：`vite.config.ts` 中写死的 `http://localhost:8080`

如果后端端口改了，直接修改 [vite.config.ts](D:/code/projects/gguide-frontend/vite.config.ts) 里的代理目标即可。

## 登录态说明

- 登录成功后，token 存储在 `localStorage`
- Axios 请求拦截器会自动把 token 放入 `Authorization` 请求头
- 如果接口返回 `401`，前端会清掉 token 并跳转到 `/auth`

## 游客模式说明

当前前端支持游客浏览：

- 未登录也可以查看游戏列表与详情
- 未登录时最近浏览会先记录在本地
- 登录后收藏、最近浏览等能力走后端接口同步

## 页面说明

### Dashboard

首页聚合了：

- 今日推荐
- For You 推荐
- 最近浏览
- 收藏列表
- Game Hub

### Game Detail

详情页展示：

- 游戏封面
- 标题、简介、评分、发售日期、地区、分类
- 收藏按钮
- 下载链接
- 预告片链接

### Profile Settings

个人设置页展示：

- 用户名
- 登录状态
- 当前语言
- 收藏统计
- 最近浏览统计
- 偏好分类

## 已知约定

- 开发环境依赖 Vite proxy，生产环境不会自动代理 `/api`
- 如果以后部署到正式环境，需要由 nginx、网关或后端同域部署来处理 `/api`
- 项目当前的 README 更偏向本地开发说明，后续还可以补部署说明
