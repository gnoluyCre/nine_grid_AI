// input: AuthContext、确认弹窗、头像地址解析与路由状态。
// output: 用户信息面板、昵称编辑与安全退出入口。
// pos: 已登录用户的全局状态展示组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ConfirmDialog } from "./ConfirmDialog";
import { resolveAvatarUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function UserAccountPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logout, refreshUser, updateNickname } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draftNickname, setDraftNickname] = useState(currentUser?.nickname ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    setDraftNickname(currentUser?.nickname ?? "");
    setError("");
    if (!isAuthenticated) {
      setEditing(false);
      setLogoutConfirmOpen(false);
    }
  }, [currentUser?.nickname, isAuthenticated]);

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/login"
          state={{ redirectTo: location.pathname }}
          className="rounded-full border border-plum/15 bg-white/82 px-4 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5"
        >
          登录
        </Link>
        <Link
          to="/register"
          state={{ redirectTo: location.pathname }}
          className="rounded-full bg-gradient-to-r from-plum to-iris px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:translate-y-[-1px]"
        >
          注册
        </Link>
      </div>
    );
  }

  async function handleNicknameSave() {
    const nextNickname = draftNickname.trim();
    if (!nextNickname) {
      setError("昵称不能为空");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const updatedUser = await updateNickname(nextNickname);
      setDraftNickname(updatedUser.nickname);
      setEditing(false);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "昵称更新失败";
      if (message === "请先登录") {
        const nextUser = await refreshUser();
        if (nextUser) {
          setError("登录状态已恢复，请重新保存昵称");
          return;
        }
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setSubmitting(true);
    setError("");
    try {
      await logout();
      setLogoutConfirmOpen(false);
      navigate("/");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "退出登录失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="rounded-[26px] border border-white/85 bg-white/86 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <img src={resolveAvatarUrl(currentUser.avatarKey)} alt={currentUser.nickname} className="h-12 w-12 rounded-2xl border border-plum/10 object-cover" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-plum/50">用户编号 {currentUser.userCode}</p>
            {editing ? (
              <div className="mt-1 flex items-center gap-2">
                <input
                  value={draftNickname}
                  onChange={(event) => setDraftNickname(event.target.value)}
                  className="field-shell h-10 min-w-[10rem] px-3 py-2 text-sm"
                  placeholder="输入新的昵称"
                />
                <button
                  type="button"
                  onClick={() => void handleNicknameSave()}
                  disabled={submitting}
                  className="rounded-full bg-plum px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftNickname(currentUser.nickname);
                    setEditing(false);
                    setError("");
                  }}
                  disabled={submitting}
                  className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-ink"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <p className="truncate font-display text-lg font-bold text-ink">{currentUser.nickname}</p>
                <button
                  type="button"
                  onClick={() => {
                    setDraftNickname(currentUser.nickname);
                    setEditing(true);
                    setError("");
                  }}
                  className="rounded-full border border-plum/12 bg-white px-2 py-1 text-xs text-plum transition hover:bg-plum/5"
                  aria-label="编辑昵称"
                >
                  ✎
                </button>
              </div>
            )}
            {error ? <p className="mt-1 text-xs text-rose-700">{error}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="ml-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-plum/20 hover:bg-plum/5"
          >
            退出
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={logoutConfirmOpen}
        title="确认退出登录"
        description="退出后将返回首页，如需继续管理当前账号的档案，需要重新登录。"
        confirmLabel="确认退出"
        loading={submitting}
        onClose={() => {
          if (!submitting) {
            setLogoutConfirmOpen(false);
          }
        }}
        onConfirm={() => {
          void handleLogout();
        }}
      />
    </>
  );
}
