export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[\p{Script=Han}A-Za-z0-9]+$/u;

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "请输入邮箱地址";
  if (!EMAIL_PATTERN.test(email)) return "请输入正确的邮箱格式";
  return undefined;
}

export function validateUsername(value: string): string | undefined {
  const username = value.trim();
  if (!username) return "请输入用户名";
  if (Array.from(username).length < 3 || Array.from(username).length > 8) {
    return "用户名长度需为 3-8 个字符";
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "用户名仅支持中文、英文和数字";
  }
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "请输入密码";
  if (value.length < 8 || value.length > 16) {
    return "密码长度需为 8-16 个字符";
  }

  const categoryCount = [/\p{L}/u, /\d/, /[^\p{L}\d]/u].filter((pattern) =>
    pattern.test(value),
  ).length;

  if (categoryCount < 2) return "密码至少包含字母、数字、特殊字符中的两种";
  return undefined;
}

export function validateEmailCode(value: string): string | undefined {
  if (!value) return "请输入邮箱验证码";
  if (!/^\d{6}$/.test(value)) return "请输入 6 位数字验证码";
  return undefined;
}
