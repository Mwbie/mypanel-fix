// تمام درخواست‌های /api/* به‌صورت خودکار توکن ورود را می‌فرستند.
// اگر سرور 401 بدهد (توکن منقضی/نامعتبر)، کاربر از سیستم خارج می‌شود.

export const TOKEN_KEY = "aplus_token";
const SESSION_KEYS = [TOKEN_KEY, "aplus_role", "aplus_customer", "aplus_userdata"];

export const clearSession = () => {
  try {
    SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* localStorage در دسترس نیست */
  }
};

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const originalFetch = window.fetch.bind(window);

window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input?.url || "";
  const isApi = url.startsWith("/api/");
  const isAuthCall = url.startsWith("/api/auth/");

  if (isApi && !isAuthCall) {
    const token = getToken();
    if (token) {
      const headers = new Headers(init.headers || {});
      headers.set("Authorization", `Bearer ${token}`);
      init = { ...init, headers };
    }
  }

  const res = await originalFetch(input, init);

  if (isApi && !isAuthCall && res.status === 401) {
    clearSession();
    window.location.reload();
  }
  return res;
};
