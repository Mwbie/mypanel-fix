import { useState } from "react";
import { Smartphone, ShieldCheck, ArrowRight, LockKeyhole } from "lucide-react";
import { TOKEN_KEY } from "./api";

// تابع تبدیل اعداد فارسی به انگلیسی و حذف فاصله اضافی
const normalizePhone = (str) => {
  if (!str) return "";
  return str
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .trim();
};

export default function LoginPage({ onLoginSuccess }) {
  const [step, setStep] = useState("phone"); // 'phone' | 'otp'
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // مرحله اول: بررسی شماره موبایل در سرور قبل از رفتن به مرحله کد تایید
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const cleanPhone = normalizePhone(phone);

    if (cleanPhone.length < 10) {
      return setError("لطفاً یک شماره موبایل معتبر وارد کنید.");
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, isAdminMode }),
      });

      // ابتدا متن پاسخ را می‌گیریم تا اگر خالی بود برنامه کرش نکند
      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        console.error("خطا در پارس پاسخ سرور:", responseText);
      }

      if (!response.ok) {
        throw new Error(
          data.error || `خطای سرور (کد وضعیت: ${response.status})`
        );
      }

      setOtp("");
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // مرحله دوم: ارسال کد به سرور؛ در صورت درست بودن توکن ورود برمی‌گردد
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const cleanOtp = normalizePhone(otp);
    if (cleanOtp.length !== 5) {
      return setError("کد تایید ۵ رقمی را وارد کنید.");
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizePhone(phone),
          code: cleanOtp,
          isAdminMode,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `خطای سرور (کد وضعیت: ${response.status})`);
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      onLoginSuccess(data.role, data.customerData, {
        name: data.name,
        permissions: data.permissions,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans dir-rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div
          className={`p-8 text-center transition-colors duration-500 ${
            isAdminMode ? "bg-slate-900" : "bg-royal-900"
          }`}
        >
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm mb-4">
            {isAdminMode ? (
              <ShieldCheck className="w-8 h-8 text-white" />
            ) : (
              <Smartphone className="w-8 h-8 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isAdminMode
              ? "پنل مدیریت و پرسنل ای‌پلاس"
              : "سامانه پیگیری تعمیرات ای‌پلاس"}
          </h2>
          <p className="text-white/70 text-sm mt-2">
            {step === "phone"
              ? "شماره موبایل خود را وارد کنید"
              : "کد تایید ۵ رقمی را وارد کنید"}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium text-center">
              {error}
            </div>
          )}

          {step === "phone" ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  شماره موبایل
                </label>
                <input
                  type="tel"
                  autoFocus
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full text-center text-xl tracking-widest p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-royal-600 transition-all dir-ltr"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isAdminMode
                    ? "bg-slate-900 hover:bg-slate-800"
                    : "bg-royal-600 hover:bg-royal-700"
                } disabled:opacity-50`}
              >
                {loading ? "در حال بررسی شماره..." : "دریافت کد تایید"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-700">
                    کد تایید ۵ رقمی
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setError("");
                    }}
                    className="text-xs text-royal-600 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <ArrowRight className="w-3 h-3" /> ویرایش شماره
                  </button>
                </div>
                <input
                  type="text"
                  autoFocus
                  required
                  maxLength={5}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="12345"
                  className="w-full text-center text-3xl tracking-[1em] font-mono p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-royal-600 transition-all dir-ltr"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isAdminMode
                    ? "bg-slate-900 hover:bg-slate-800"
                    : "bg-royal-600 hover:bg-royal-700"
                } disabled:opacity-50`}
              >
                <LockKeyhole className="w-5 h-5" /> {loading ? "در حال بررسی..." : "ورود به سیستم"}
              </button>
            </form>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          setIsAdminMode(!isAdminMode);
          setStep("phone");
          setPhone("");
          setOtp("");
          setError("");
        }}
        className="mt-8 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
      >
        {isAdminMode ? "ورود به عنوان مشتری" : "ورود پرسنل ای‌پلاس"}
      </button>
    </div>
  );
}
