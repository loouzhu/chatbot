import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { EyeIcon } from "./Icons";
import styles from "../styles/Auth.module.less";

interface FormFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  icon: ReactNode;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
}

export function FormField({
  label,
  icon,
  error,
  hint,
  trailing,
  id,
  type = "text",
  ...inputProps
}: FormFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={inputId}>{label}</label>
      <div className={`${styles.inputShell} ${error ? styles.inputError : ""}`}>
        <span className={styles.inputIcon}>{icon}</span>
        <input
          {...inputProps}
          id={inputId}
          type={isPassword && passwordVisible ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        {isPassword && (
          <button
            className={styles.iconButton}
            type="button"
            onClick={() => setPasswordVisible((value) => !value)}
            aria-label={passwordVisible ? "隐藏密码" : "显示密码"}
          >
            <EyeIcon open={passwordVisible} />
          </button>
        )}
        {trailing}
      </div>
      {error ? (
        <span className={styles.fieldError} id={`${inputId}-error`}>
          {error}
        </span>
      ) : hint ? (
        <span className={styles.fieldHint} id={`${inputId}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
