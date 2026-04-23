// input: AuthContext、页面组件与路由状态。
// output: 前端应用的顶层路由结构。
// pos: frontend/src 的应用壳入口。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { InputPage } from "./pages/InputPage";
import { LoginPage } from "./pages/LoginPage";
import { RecordsPage } from "./pages/RecordsPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResultPage } from "./pages/ResultPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-xl rounded-[28px] border border-white/80 bg-white/82 px-6 py-8 text-center text-sm text-ink/60 shadow-soft">
          正在加载登录状态...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: `${location.pathname}${location.search}` }} />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<InputPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/records"
        element={
          <RequireAuth>
            <RecordsPage />
          </RequireAuth>
        }
      />
      <Route path="/result" element={<ResultPage />} />
    </Routes>
  );
}
