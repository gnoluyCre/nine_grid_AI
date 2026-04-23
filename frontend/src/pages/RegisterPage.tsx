// input: AuthContext、路由状态与密码字段组件。
// output: 邮箱注册与验证码确认页面。
// pos: 前端账号注册页面容器。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";

interface AuthRouteState {
  redirectTo?: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmRegister, isAuthenticated, sendRegisterCode } = useAuth();
  const routeState = (location.state as AuthRouteState | undefined) ?? {};
  const redirectTo = routeState.redirectTo || "/";
  const [step, setStep] = useState<"form" | "verify">("form");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
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
      const result = await sendRegisterCode({ nickname, email, password, confirmPassword });
      setNotice(result.message);
      setStep("verify");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "验证码发送失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await confirmRegister({ nickname, email, password, confirmPassword, verificationCode });
      navigate(redirectTo, { replace: true });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "注册失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendCode() {
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const result = await sendRegisterCode({ nickname, email, password, confirmPassword });
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
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum/55">Create Account</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink">{step === "form" ? "邮箱注册" : "验证邮箱"}</h1>
          <p className="mt-3 text-sm leading-6 text-ink/62">
            {step === "form" ? "注册后系统会自动分配 6 位用户编号和固定头像。" : `验证码已发送到 ${email}，输入后即可自动完成注册并登录。`}
          </p>
          {step === "form" ? (
            <form className="mt-8 space-y-5" onSubmit={handleSendCode}>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">昵称</span>
                <input className="field-shell w-full" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="请输入昵称" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">邮箱</span>
                <input className="field-shell w-full" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="请输入邮箱地址" />
              </label>
              <PasswordField label="密码" value={password} onChange={setPassword} placeholder="至少 6 位字符" />
              <PasswordField label="确认密码" value={confirmPassword} onChange={setConfirmPassword} placeholder="请再次输入密码" />
              {error ? <p className="text-sm text-rose-700">{error}</p> : null}
              <button type="submit" disabled={submitting} className="w-full rounded-full bg-gradient-to-r from-plum to-iris px-5 py-3 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "发送中..." : "发送验证码"}
              </button>
            </form>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleConfirmRegister}>
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
              {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
              {error ? <p className="text-sm text-rose-700">{error}</p> : null}
              <button type="submit" disabled={submitting} className="w-full rounded-full bg-gradient-to-r from-plum to-iris px-5 py-3 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "校验中..." : "完成注册并登录"}
              </button>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setVerificationCode("");
                    setError("");
                    setNotice("");
                  }}
                  className="font-semibold text-ink/65"
                >
                  返回修改信息
                </button>
                <button type="button" onClick={() => void handleResendCode()} disabled={submitting} className="font-semibold text-plum disabled:opacity-60">
                  重新发送验证码
                </button>
              </div>
            </form>
          )}
          <p className="mt-5 text-sm text-ink/60">
            已有账号？
            <Link to="/login" state={{ redirectTo }} className="ml-2 font-semibold text-plum">
              去登录
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
