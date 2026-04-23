// input: 鉴权 API、React context 与用户类型模型。
// output: 全局登录状态、登录校验与鉴权动作。
// pos: 前端鉴权状态中心。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { createContext, useContext, useEffect, useState } from "react";
import {
  confirmRegister as confirmRegisterRequest,
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  resetPassword as resetPasswordRequest,
  sendPasswordResetCode as sendPasswordResetCodeRequest,
  sendRegisterCode as sendRegisterCodeRequest,
  updateCurrentUser,
} from "../lib/api";
import type {
  CurrentUser,
  LoginRequest,
  MessageResponse,
  PasswordResetConfirmRequest,
  PasswordResetSendCodeRequest,
  RegisterConfirmRequest,
  RegisterSendCodeRequest,
} from "../types/models";

interface AuthContextValue {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (payload: LoginRequest) => Promise<CurrentUser>;
  sendRegisterCode: (payload: RegisterSendCodeRequest) => Promise<MessageResponse>;
  confirmRegister: (payload: RegisterConfirmRequest) => Promise<CurrentUser>;
  sendPasswordResetCode: (payload: PasswordResetSendCodeRequest) => Promise<MessageResponse>;
  resetPassword: (payload: PasswordResetConfirmRequest) => Promise<MessageResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<CurrentUser | null>;
  updateNickname: (nickname: string) => Promise<CurrentUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function refreshUser() {
    const nextUser = await fetchCurrentUser();
    setCurrentUser(nextUser);
    return nextUser;
  }

  useEffect(() => {
    void (async () => {
      try {
        await refreshUser();
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  async function login(payload: LoginRequest) {
    await loginRequest(payload);
    const user = await refreshUser();
    if (!user) {
      throw new Error("登录状态校验失败，请重试");
    }
    return user;
  }

  async function sendRegisterCode(payload: RegisterSendCodeRequest) {
    return sendRegisterCodeRequest(payload);
  }

  async function confirmRegister(payload: RegisterConfirmRequest) {
    await confirmRegisterRequest(payload);
    const user = await refreshUser();
    if (!user) {
      throw new Error("注册后的登录状态校验失败，请重试");
    }
    return user;
  }

  async function sendPasswordResetCode(payload: PasswordResetSendCodeRequest) {
    return sendPasswordResetCodeRequest(payload);
  }

  async function resetPassword(payload: PasswordResetConfirmRequest) {
    return resetPasswordRequest(payload);
  }

  async function logout() {
    await logoutRequest();
    setCurrentUser(null);
  }

  async function updateNickname(nickname: string) {
    const user = await updateCurrentUser({ nickname });
    setCurrentUser(user);
    return user;
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        authLoading,
        login,
        sendRegisterCode,
        confirmRegister,
        sendPasswordResetCode,
        resetPassword,
        logout,
        refreshUser,
        updateNickname,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
