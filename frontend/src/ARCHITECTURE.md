一旦我所属的文件夹有所变化请更新我

# frontend/src 目录说明

本目录是前端主源码区，负责页面、组件、状态、类型和 API 调用。  
应用从 `main.tsx` 启动，经 `App.tsx` 组装路由，再分发到各页面与组件。  
主要子目录为 `components`、`pages`、`lib`、`context`、`types`。

| 文件名 | 地位 | 功能 |
| --- | --- | --- |
| `App.tsx` | 路由壳 | 组织前端页面路由 |
| `main.tsx` | 启动入口 | 挂载 React 应用与 Provider |
| `styles.css` | 全局样式 | 定义基础视觉与通用样式类 |
| `vite-env.d.ts` | 声明文件 | 提供 Vite 环境类型声明 |

子目录提示：`components` 放通用 UI，`pages` 放页面容器，`lib` 放工具与接口，`context` 放全局状态，`types` 放共享类型。  
其中 `AuthContext.tsx` 负责登录后的二次校验，`UserAccountPanel.tsx` 负责登录态展示、昵称编辑与安全退出，`RecordsPage.tsx` 和 `InputPage.tsx` 依赖鉴权状态决定是否请求受保护接口。  
`BirthForm.tsx` 与 `SubmitAction.tsx` 共同控制“开始排盘”按钮在必填项未完成前不可点击，`RecordDetailDialog.tsx` 负责档案管理内的只读详情弹层。
