// input: AuthContext、路由状态与密码字段组件。
// output: 找回密码与验证码重置页面。
// pos: 前端账号恢复页面容器。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";

interface AuthRouteState {
  redirectTo?: string;
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, resetPassword, sendPasswordResetCode } = useAuth();
  const routeState = (location.state as AuthRouteState | undefined) ?? {};
  const redirectTo = routeState.redirectTo || "/login";
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const result = await sendPasswordResetCode({ email });
      setNotice(result.message);
      setStep("reset");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "验证码发送失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const result = await resetPassword({ email, verificationCode, newPassword, confirmPassword });
      setNotice(result.message);
      navigate("/login", { replace: true, state: { redirectTo } });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "密码重置失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendCode() {
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const result = await sendPasswordResetCode({ email });
      setNotice(result.message);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "验证码发送失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <section className="card-surface p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum/55">Password Recovery</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink">{step === "email" ? "找回密码" : "重置密码"}</h1>
          <p className="mt-3 text-sm leading-6 text-ink/62">
            {step === "email" ? "输入注册邮箱后，系统会向你的邮箱发送重置验证码。" : `验证码已发送到 ${email}，输入后即可设置新密码。`}
          </p>
          {step === "email" ? (
            <form className="mt-8 space-y-5" onSubmit={handleSendCode}>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">邮箱</span>
                <input className="field-shell w-full" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="请输入邮箱地址" />
              </label>
              {error ? <p className="text-sm text-rose-700">{error}</p> : null}
              <button type="submit" disabled={submitting} className="w-full rounded-full bg-gradient-to-r from-plum to-iris px-5 py-3 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "发送中..." : "发送验证码"}
              </button>
            </form>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleResetPassword}>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">邮箱验证码</span>
                <input
                  className="field-shell w-full"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="请输入 6 位验证码"
                  maxLength={6}
                />
              </label>
              <PasswordField label="新密码" value={newPassword} onChange={setNewPassword} placeholder="至少 6 位字符" />
              <PasswordField label="确认新密码" value={confirmPassword} onChange={setConfirmPassword} placeholder="请再次输入新密码" />
              {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
              {error ? <p className="text-sm text-rose-700">{error}</p> : null}
              <button type="submit" disabled={submitting} className="w-full rounded-full bg-gradient-to-r from-plum to-iris px-5 py-3 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "提交中..." : "重置密码"}
              </button>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setVerificationCode("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError("");
                    setNotice("");
                  }}
                  className="font-semibold text-ink/65"
                >
                  返回修改邮箱
                </button>
                <button type="button" onClick={() => void handleResendCode()} disabled={submitting} className="font-semibold text-plum disabled:opacity-60">
                  重新发送验证码
                </button>
              </div>
            </form>
          )}
          <p className="mt-5 text-sm text-ink/60">
            想起密码了？
            <Link to="/login" state={{ redirectTo }} className="ml-2 font-semibold text-plum">
              返回登录
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
