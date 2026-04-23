// input: AuthContext、路由状态与密码字段组件。
// output: 邮箱登录页面。
// pos: 前端账号登录页面容器。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";

interface AuthRouteState {
  redirectTo?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const routeState = (location.state as AuthRouteState | undefined) ?? {};
  const redirectTo = routeState.redirectTo || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <section className="card-surface p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum/55">Welcome Back</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink">邮箱登录</h1>
          <p className="mt-3 text-sm leading-6 text-ink/62">登录后即可隔离自己的排盘结果和档案信息。</p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">邮箱</span>
              <input className="field-shell w-full" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="请输入邮箱地址" />
            </label>
            <PasswordField label="密码" value={password} onChange={setPassword} placeholder="请输入密码" />
            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
            <button type="submit" disabled={submitting} className="w-full rounded-full bg-gradient-to-r from-plum to-iris px-5 py-3 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "登录中..." : "登录"}
            </button>
          </form>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/60">
            <p>
              还没有账号？
              <Link to="/register" state={{ redirectTo }} className="ml-2 font-semibold text-plum">
                去注册
              </Link>
            </p>
            <Link to="/forgot-password" state={{ redirectTo }} className="font-semibold text-plum">
              忘记密码
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
