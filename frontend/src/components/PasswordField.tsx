// input: 标签、密码值与变更回调。
// output: 可显示/隐藏密码的输入框。
// pos: 登录注册找回密码共用字段组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { useId, useState } from "react";

interface PasswordFieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

export function PasswordField({ label, value, placeholder, onChange }: PasswordFieldProps) {
  const inputId = useId();
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">{label}</span>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          className="field-shell w-full pr-12"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-plum/65 transition hover:bg-plum/6 hover:text-plum"
          aria-label={visible ? "隐藏密码" : "显示密码"}
          title={visible ? "隐藏密码" : "显示密码"}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </label>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.7 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17.7 17.7 0 0 1-4 4.5" />
      <path d="M6.2 6.8A17.3 17.3 0 0 0 2.5 12s3.5 6 9.5 6c1.5 0 2.9-.3 4.1-.8" />
      <path d="M9.9 9.9A3 3 0 0 0 14.1 14.1" />
    </svg>
  );
}
