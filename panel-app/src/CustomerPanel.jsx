import { useState, useEffect, useMemo } from "react";
import {
  Smartphone,
  Wrench,
  CheckCircle2,
  Clock,
  Star,
  Wallet,
  Gift,
  Copy,
  Check,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Calendar,
  History,
  Sparkles,
} from "lucide-react";

// ============================================================================
// [SECTION 1] تنظیمات پایه و مراحل نوار وضعیت (Constants & Steps)
// اگر خواستی متن یا آیکون مراحل نوار وضعیت را عوض کنی، فقط این آرایه را ویرایش کن
// ============================================================================
const REPAIR_STEPS = [
  { key: "received", label: "پذیرش دستگاه", icon: Smartphone },
  { key: "in_progress", label: "در حال تعمیر", icon: Wrench },
  { key: "ready", label: "آماده تحویل", icon: CheckCircle2 },
  { key: "delivered", label: "تحویل مشتری", icon: ShieldCheck },
];

// ============================================================================
// [SECTION 2] کامپوننت مستقل نوار وضعیت بصری (Status Progress Bar)
// ============================================================================
function StatusProgressBar({ status }) {
  if (status === "unrepairable") {
    return (
      <div className="my-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700">
        <XCircle className="w-6 h-6 shrink-0 text-rose-600" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold block text-sm">غیرقابل تعمیر</span>
          متاسفانه به دلیل شدت آسیب‌دیدگی، امکان تعمیر استاندارد این دستگاه وجود نداشت و آماده استرداد به شماست.
        </div>
      </div>
    );
  }

  const currentStepIndex = REPAIR_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="my-5 px-2">
      <div className="relative flex items-center justify-between">
        {/* خط پس‌زمینه خاکستری */}
        <div className="absolute right-0 left-0 top-5 h-1 bg-slate-200 -z-0 rounded-full" />

        {/* خط پرشونده رنگی بر اساس مرحله فعلی */}
        <div
          className="absolute right-0 top-5 h-1 bg-emerald-500 transition-all duration-500 rounded-full"
          style={{
            width: `${
              currentStepIndex >= 0
                ? (currentStepIndex / (REPAIR_STEPS.length - 1)) * 100
                : 0
            }%`,
          }}
        />

        {REPAIR_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center gap-2"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  isCurrent
                    ? "bg-royal-900 text-white border-royal-900 ring-4 ring-royal-100 scale-110"
                    : isCompleted
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-slate-400 border-slate-200"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[11px] font-bold text-center ${
                  isCurrent
                    ? "text-royal-900"
                    : isCompleted
                    ? "text-emerald-700"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// [SECTION 3] کامپوننت اصلی پنل مشتری و مدیریت Stateها
// ============================================================================
export default function CustomerPanel({ customerData, onLogout }) {
  const [profile, setProfile] = useState(
    customerData || {
      name: "",
      phone: "",
      referralCode: "",
      walletBalance: 0,
      repairs: [],
    }
  );
  const [activeTab, setActiveTab] = useState("current"); // 'current' | 'history' | 'club'
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // استیت موقت برای ثبت امتیاز هر دستگاه: { [repairId]: { rating: 5, feedback: '' } }
  const [ratingInputs, setRatingInputs] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  // ==========================================================================
  // [SECTION 4] سینک خودکار اطلاعات با سرور (Live Sync & API Handlers)
  // ==========================================================================
  const fetchLatestProfile = async (silent = false) => {
    if (!profile.phone) return;
    if (!silent) setIsSyncing(true);
    try {
      const res = await fetch(`/api/customer-profile/${profile.phone}`);
      if (res.ok) {
        const latestData = await res.json();
        setProfile(latestData);
      }
    } catch (err) {
      console.error("خطا در بروزرسانی اطلاعات مشتری:", err);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // بروزرسانی خودکار هر 10 ثانیه بدون نیاز به رفرش صفحه توسط مشتری
  useEffect(() => {
    fetchLatestProfile(true);
    const interval = setInterval(() => {
      fetchLatestProfile(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [profile.phone]);

  // تایید یا رد هزینه اعلام‌شده توسط تعمیرکار
  const handleCostDecision = async (repairId, approved) => {
    setSubmittingId(repairId);
    try {
      const res = await fetch(`/api/repairs/${repairId}/approve-cost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      if (res.ok) {
        await fetchLatestProfile(true);
      }
    } catch (err) {
      console.error("خطا در ثبت تاییدیه هزینه:", err);
    } finally {
      setSubmittingId(null);
    }
  };

  // ثبت امتیاز و نظر مشتری (پس از ثبت، رکورد خودکار به تب تاریخچه می‌رود)
  const handleRatingSubmit = async (repairId) => {
    const input = ratingInputs[repairId];
    if (!input || !input.rating) {
      alert("لطفاً ابتدا ستاره امتیاز را انتخاب کنید.");
      return;
    }

    setSubmittingId(repairId);
    try {
      const res = await fetch(`/api/repairs/${repairId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: input.rating,
          feedback: input.feedback || "",
        }),
      });
      if (res.ok) {
        await fetchLatestProfile(true);
      }
    } catch (err) {
      console.error("خطا در ثبت نظر:", err);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCopyReferral = () => {
    if (!profile.referralCode) return;
    navigator.clipboard.writeText(profile.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ==========================================================================
  // [SECTION 5] تفکیک هوشمند تعمیرات جاری و تاریخچه
  // دستگاهی که تحویل شده و نظرش هم ثبت شده، از وضعیت جاری خارج می‌شود
  // ==========================================================================
  const { currentRepairs, historyRepairs } = useMemo(() => {
    const list = profile.repairs || [];
    const current = [];
    const history = [];

    list.forEach((item) => {
      const isFinishedAndRated =
        item.status === "delivered" && Boolean(item.satisfaction);

      if (isFinishedAndRated) {
        history.push(item);
      } else {
        current.push(item);
      }
    });

    return { currentRepairs: current, historyRepairs: history };
  }, [profile.repairs]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans dir-rtl pb-12">
      {/* =====================================================================
          [SECTION 6] هدر بالای پنل مشتری و تب‌بندی
      ===================================================================== */}
      <header className="bg-royal-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-xs">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg">
                ای‌پلاس (A Plus)
              </h1>
              <p className="text-xs text-white/80">
                خوش آمدید، {profile.name || "مشتری گرامی"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLatestProfile(false)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="بروزرسانی وضعیت"
            >
              <RefreshCw
                className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> خروج
            </button>
          </div>
        </div>

        {/* نوار تب‌های پنل مشتری */}
        <div className="max-w-3xl mx-auto px-4 flex gap-2 border-t border-white/10 pt-2">
          <button
            onClick={() => setActiveTab("current")}
            className={`flex-1 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "current"
                ? "border-amber-400 text-white"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Wrench className="w-4 h-4" />
            تعمیرات جاری ({currentRepairs.length})
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "history"
                ? "border-amber-400 text-white"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            تاریخچه و گارانتی ({historyRepairs.length})
          </button>

          <button
            onClick={() => setActiveTab("club")}
            className={`flex-1 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "club"
                ? "border-amber-400 text-white"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Gift className="w-4 h-4" />
            کیف پول و هدیه
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-5">
        {/* ===================================================================
            [SECTION 7A] تب اول: تعمیرات جاری (همراه با نوار وضعیت و تایید هزینه)
        =================================================================== */}
        {activeTab === "current" && (
          <div className="space-y-5">
            {currentRepairs.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xs space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-base text-slate-800">
                  در حال حاضر دستگاهی در نوبت تعمیر ندارید
                </h3>
                <p className="text-xs text-slate-500">
                  سوابق تعمیرات قبلی و کارت‌های گارانتی شما در تب «تاریخچه و گارانتی» قابل مشاهده است.
                </p>
              </div>
            ) : (
              currentRepairs.map((item) => {
                const isCostIncreased =
                  item.previousEstimatedCost > 0 &&
                  item.estimatedCost > item.previousEstimatedCost;

                const currentRating = ratingInputs[item.id]?.rating || 0;
                const currentFeedback = ratingInputs[item.id]?.feedback || "";

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4"
                  >
                    {/* مشخصات بالای کارت */}
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                          کد پیگیری: {item.id}
                        </span>
                        <h2 className="font-bold text-lg text-slate-900 mt-2">
                          {item.device}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          ایراد اعلامی شما: {item.issue}
                        </p>
                      </div>
                      <div className="text-left text-[11px] text-slate-400">
                        <div>تاریخ پذیرش:</div>
                        <div className="font-mono mt-0.5 dir-ltr">
                          {item.receptionDate}
                        </div>
                      </div>
                    </div>

                    {/* نوار وضعیت گرافیکی */}
                    <StatusProgressBar status={item.status} />

                    {/* نمایش زمان حدودی آماده‌سازی یا زمان دقیق آماده شدن */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {item.technicalIssue && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                          <span className="text-slate-400 block mb-1">
                            تشخیص فنی کارشناس:
                          </span>
                          <span className="font-bold text-slate-800">
                            {item.technicalIssue}
                          </span>
                        </div>
                      )}

                      {item.status === "in_progress" &&
                        item.estimatedReadyTime && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center gap-2.5 text-amber-900">
                            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                              <span className="text-amber-700/80 block mb-0.5">
                                زمان حدودی آماده شدن دستگاه:
                              </span>
                              <span className="font-black text-sm">
                                {item.estimatedReadyTime}
                              </span>
                            </div>
                          </div>
                        )}

                      {item.status === "ready" && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center gap-2.5 text-emerald-900">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-emerald-700/80 block mb-0.5">
                              دستگاه آماده تحویل است (ساعت ثبت):
                            </span>
                            <span className="font-black text-sm dir-ltr inline-block">
                              {item.readyDate || "آماده در فروشگاه"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* باکس تایید هزینه اولیه یا تایید مجدد افزایش هزینه */}
                    {item.estimatedCost > 0 && item.status !== "delivered" && (
                      <div
                        className={`p-4 rounded-xl border ${
                          item.costApproved === "pending"
                            ? "bg-amber-50/70 border-amber-300"
                            : item.costApproved === "approved"
                            ? "bg-emerald-50/60 border-emerald-200"
                            : "bg-rose-50/60 border-rose-200"
                        }`}
                      >
                        {isCostIncreased && item.costApproved === "pending" && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-2 bg-amber-100/80 px-3 py-1.5 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              مشتری گرامی، پس از بررسی دقیق‌تر برد، هزینه تعمیر نسبت به برآورد اولیه{" "}
                              <del className="text-slate-500 mx-1">
                                ({item.previousEstimatedCost.toLocaleString()} تومان)
                              </del>{" "}
                              تغییر یافته است و نیازمند تایید مجدد شماست:
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-xs text-slate-600">
                              {isCostIncreased
                                ? "هزینه جدید اعلام‌شده:"
                                : "برآورد هزینه تعمیر:"}
                            </span>
                            <div className="text-lg font-black text-slate-900 mt-0.5">
                              {item.estimatedCost.toLocaleString()}{" "}
                              <span className="text-xs font-normal">تومان</span>
                            </div>
                          </div>

                          {item.costApproved === "pending" && (
                            <div className="flex items-center gap-2">
                              <button
                                disabled={submittingId === item.id}
                                onClick={() =>
                                  handleCostDecision(item.id, true)
                                }
                                className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                تایید هزینه و ادامه تعمیر
                              </button>
                              <button
                                disabled={submittingId === item.id}
                                onClick={() =>
                                  handleCostDecision(item.id, false)
                                }
                                className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                عدم تایید (انصراف)
                              </button>
                            </div>
                          )}

                          {item.costApproved === "approved" && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                              <CheckCircle2 className="w-4 h-4" /> مورد تایید شما
                            </span>
                          )}

                          {item.costApproved === "rejected" && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1.5 rounded-lg">
                              <XCircle className="w-4 h-4" /> رد شده توسط شما
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* فرم نظرسنجی (وقتی دستگاه تحویل شده؛ با ثبت نظر، پرونده به تاریخچه می‌رود) */}
                    {item.status === "delivered" && !item.satisfaction && (
                      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                          <Sparkles className="w-5 h-5 text-blue-600" />
                          ثبت رضایت‌سنجی و انتقال پرونده به کارت گارانتی
                        </div>
                        <p className="text-xs text-slate-600">
                          دستگاه شما تحویل داده شده است. لطفاً میزان رضایت خود را از خدمات ای‌پلاس ثبت کنید:
                        </p>

                        <div className="flex items-center gap-2 py-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setRatingInputs((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    rating: star,
                                  },
                                }))
                              }
                              className="p-1 focus:outline-none cursor-pointer transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-7 h-7 ${
                                  star <= currentRating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>

                        <textarea
                          rows={2}
                          value={currentFeedback}
                          onChange={(e) =>
                            setRatingInputs((prev) => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                feedback: e.target.value,
                              },
                            }))
                          }
                          placeholder="نظر یا پیشنهاد شما درباره کیفیت تعمیر (اختیاری)..."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-royal-900 resize-none"
                        />

                        <button
                          disabled={submittingId === item.id || !currentRating}
                          onClick={() => handleRatingSubmit(item.id)}
                          className="w-full py-2.5 bg-royal-900 hover:bg-royal-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          ثبت امتیاز و دریافت برگ گارانتی در تاریخچه
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===================================================================
            [SECTION 7B] تب دوم: تاریخچه مراجعات و کارت گارانتی
        =================================================================== */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {historyRepairs.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-sm">
                هنوز پرونده تکمیل‌شده‌ای در تاریخچه ندارید.
              </div>
            ) : (
              historyRepairs.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-mono text-xs text-slate-400">
                        #{item.id}
                      </span>
                      <h3 className="font-bold text-base text-slate-900">
                        {item.device}
                      </h3>
                    </div>

                    {item.warrantyMonths > 0 ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-4 h-4" />
                        دارای {item.warrantyMonths} ماه گارانتی معتبر ای‌پلاس
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        تحویل شده
                      </span>
                    )}
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-600">
                    <div>
                      <span className="text-slate-400">خدمات انجام‌شده: </span>
                      <b className="text-slate-800">
                        {item.serviceDescription ||
                          item.technicalIssue ||
                          item.issue}
                      </b>
                    </div>
                    <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                      <span>تاریخ تحویل: {item.deliveryDate || "-"}</span>
                      {item.satisfaction && (
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          امتیاز ثبت‌شده شما: {item.satisfaction} از ۵
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===================================================================
            [SECTION 7C] تب سوم: کیف پول تخفیف و کد معرف باشگاه مشتریان
        =================================================================== */}
        {activeTab === "club" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-l from-royal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-white/70 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" /> موجودی کیف پول تخفیف شما
                </span>
                <div className="text-2xl md:text-3xl font-black">
                  {(profile.walletBalance || 0).toLocaleString()}{" "}
                  <span className="text-xs font-normal text-white/80">
                    تومان
                  </span>
                </div>
                <p className="text-[11px] text-white/60 pt-1">
                  قابل کسر مستقیم از فاکتور تعمیرات بعدی شما در ای‌پلاس
                </p>
              </div>
              <Gift className="w-12 h-12 text-amber-400 opacity-90" />
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-800">
                معرفی دوستان و دریافت ۲۰۰,۰۰۰ تومان هدیه!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                کد معرف اختصاصی خود را به دوستانتان بدهید. با اولین تعمیر و تحویل دستگاه آن‌ها در ای‌پلاس، مبلغ{" "}
                <b>۲۰۰,۰۰۰ تومان</b> به کیف پول شما شارژ می‌شود.
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    کد معرف اختصاصی شما:
                  </span>
                  <span className="font-mono font-black text-base text-royal-900 tracking-wider">
                    {profile.referralCode || "در حال صدور"}
                  </span>
                </div>
                <button
                  onClick={handleCopyReferral}
                  className="px-3.5 py-2 bg-royal-900 hover:bg-royal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" /> کپی شد!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> کپی کد معرف
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}