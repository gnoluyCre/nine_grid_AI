// input: React、路由、全局样式与应用根组件。
// output: 浏览器端应用挂载结果。
// pos: 前端运行时启动入口。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { BatchExportProvider } from "./context/BatchExportContext";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <BatchExportProvider>
          <App />
        </BatchExportProvider>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
);
