import {
  Menu,
  X,
  Wrench,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  Users,
  Boxes,
  Truck,
  Calculator,
  MessageSquare,
  Settings,
} from "lucide-react";

export default function MobileHeader({
  isOpen,
  setIsOpen,
  activeMenu,
  setActiveMenu,
  permissions,
  userData,
  userRole,
  isDarkMode,
  toggleDarkMode,
  onLogout,
}) {
  return (
    <>
      <div
        className={`md:hidden ${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        } border-b px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs`}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-royal-900 text-white p-1.5 rounded-lg">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="font-bold text-base">ای‌پلاس (A Plus)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-amber-300 cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`relative w-72 max-w-[82%] ${
              isDarkMode
                ? "bg-slate-800 text-slate-100"
                : "bg-white text-slate-800"
            } h-full shadow-2xl flex flex-col z-10`}
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-royal-900 text-white p-2 rounded-lg">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base">ای‌پلاس (A Plus)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {userData?.name ||
                      (userRole === "admin" ? "مدیر کل" : "پنل پرسنل")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 mb-2 px-3">
                منوی سیستم
              </div>

              {permissions.includes("dashboard") && (
                <button
                  onClick={() => {
                    setActiveMenu("dashboard");
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    activeMenu === "dashboard"
                      ? "bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-white font-bold"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" /> پیشخوان تعمیرات
                </button>
              )}

              {permissions.includes("customers") && (
                <button
                  onClick={() => {
                    setActiveMenu("customers");
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    activeMenu === "customers"
                      ? "bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-white font-bold"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <Users className="w-5 h-5" /> پرونده مشتریان
                </button>
              )}

              {permissions.includes("inventory") && (
                <button
                  onClick={() => {
                    setActiveMenu("inventory");
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    activeMenu === "inventory"
                      ? "bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-white font-bold"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <Boxes className="w-5 h-5" /> انبار و کالا
                </button>
              )}

              {permissions.includes("suppliers") && (
                <button
                  onClick={() => {
                    setActiveMenu("suppliers");
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    activeMenu === "suppliers"
                      ? "bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-white font-bold"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <Truck className="w-5 h-5" /> تأمین‌کنندگان قطعات
                </button>
              )}

              {permissions.includes("accounting") && (
                <button
                  onClick={() => {
                    setActiveMenu("accounting");
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    activeMenu === "accounting"
                      ? "bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-white font-bold"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <Calculator className="w-5 h-5" /> حسابداری و مالی
                </button>
              )}

              {permissions.includes("sms") && (
                <button
                  onClick={() => {
                    setActiveMenu("sms");
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    activeMenu === "sms"
                      ? "bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-white font-bold"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <MessageSquare className="w-5 h-5" /> پیامک و باشگاه
                </button>
              )}

              {permissions.includes("settings") && (
                <button
                  onClick={() => {
                    setActiveMenu("settings");
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    activeMenu === "settings"
                      ? "bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-white font-bold"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <Settings className="w-5 h-5" /> تنظیمات و پرسنل
                </button>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                <LogOut className="w-5 h-5" /> خروج از حساب
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}