import { useId, type ReactNode } from "react";
import { Input, type InputProps } from "antd";
import styles from "../styles/Auth.module.less";

interface FormFieldProps extends Omit<InputProps, "prefix" | "suffix"> {
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
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const sharedProps: InputProps = {
    ...inputProps,
    id: inputId,
    prefix: icon,
    status: error ? "error" : undefined,
    className: styles.formControl,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
  };

  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={inputId}>{label}</label>
      {type === "password" ? (
        <Input.Password {...sharedProps} />
      ) : (
        <Input {...sharedProps} type={type} suffix={trailing} />
      )}
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
