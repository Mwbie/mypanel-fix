import {
  LayoutDashboard,
  Users,
  Boxes,
  Truck,
  Calculator,
  MessageSquare,
  Settings,
  LogOut,
  Moon,
  Sun,
  Wrench,
} from "lucide-react";

export default function Sidebar({
  activeMenu,
  setActiveMenu,
  permissions,
  customersCount,
  userData,
  userRole,
  isDarkMode,
  toggleDarkMode,
  onLogout,
}) {
  return (
    <aside
      className={`w-64 ${
        isDarkMode
          ? "bg-slate-800 border-slate-700"
          : "bg-white border-slate-200"
      } border-l flex-col hidden md:flex h-screen sticky top-0`}
    >
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-royal-900 text-white p-2 rounded-lg">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg">ای‌پلاس (A Plus)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {userData?.name ||
                (userRole === "admin" ? "مدیر کل" : "پنل پرسنل")}
            </p>
          </div>
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-amber-300 cursor-pointer"
          title="تغییر تم"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="p-3 flex-1 overflow-y-auto space-y-1">
        <div className="text-[11px] font-semibold text-slate-400 mb-2 px-3 mt-1">
          منوی اصلی
        </div>

        {permissions.includes("dashboard") && (
          <button
            onClick={() => setActiveMenu("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
              activeMenu === "dashboard"
                ? "bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-white font-bold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" /> پیشخوان تعمیرات
          </button>
        )}

        {permissions.includes("customers") && (
          <button
            onClick={() => setActiveMenu("customers")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
              activeMenu === "customers"
                ? "bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-white font-bold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Users className="w-5 h-5" /> پرونده مشتریان ({customersCount})
          </button>
        )}

        {permissions.includes("inventory") && (
          <button
            onClick={() => setActiveMenu("inventory")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
              activeMenu === "inventory"
                ? "bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-white font-bold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Boxes className="w-5 h-5" /> انبار و کالا
          </button>
        )}

        {permissions.includes("suppliers") && (
          <button
            onClick={() => setActiveMenu("suppliers")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
              activeMenu === "suppliers"
                ? "bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-white font-bold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Truck className="w-5 h-5" /> تأمین‌کنندگان قطعات
          </button>
        )}

        {permissions.includes("accounting") && (
          <button
            onClick={() => setActiveMenu("accounting")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
              activeMenu === "accounting"
                ? "bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-white font-bold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Calculator className="w-5 h-5" /> حسابداری و مالی
          </button>
        )}

        {permissions.includes("sms") && (
          <button
            onClick={() => setActiveMenu("sms")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
              activeMenu === "sms"
                ? "bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-white font-bold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <MessageSquare className="w-5 h-5" /> پیامک و باشگاه
          </button>
        )}

        {permissions.includes("settings") && (
          <button
            onClick={() => setActiveMenu("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
              activeMenu === "settings"
                ? "bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-white font-bold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Settings className="w-5 h-5" /> تنظیمات و پرسنل
          </button>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
        >
          <LogOut className="w-5 h-5" /> خروج از حساب
        </button>
      </div>
    </aside>
  );
}