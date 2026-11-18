import { Calculator, Calendar, TrendingUp } from "lucide-react";

export default function AccountingTab({
  isDarkMode,
  accountingDateFilter,
  setAccountingDateFilter,
  accountingStats,
  filteredDeliveredRepairs,
}) {
  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <header
        className={`${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        } p-5 rounded-xl shadow-xs border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Calculator className="w-6 h-6 text-royal-900 dark:text-sky-400" />{" "}
            حسابداری و تراز سود ای‌پلاس
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            گزارش‌گیری روزانه، هفتگی و ماهانه از سود خالص، هزینه قطعات و دریافتی‌ها
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-1.5 rounded-xl text-xs font-bold">
          <Calendar className="w-4 h-4 text-slate-500 mr-1" />
          <button
            onClick={() => setAccountingDateFilter("all")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              accountingDateFilter === "all"
                ? "bg-white dark:bg-slate-900 text-royal-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            کل دوره‌ها
          </button>
          <button
            onClick={() => setAccountingDateFilter("today")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              accountingDateFilter === "today"
                ? "bg-white dark:bg-slate-900 text-royal-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            امروز
          </button>
          <button
            onClick={() => setAccountingDateFilter("7days")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              accountingDateFilter === "7days"
                ? "bg-white dark:bg-slate-900 text-royal-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            ۷ روز اخیر
          </button>
          <button
            onClick={() => setAccountingDateFilter("30days")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              accountingDateFilter === "30days"
                ? "bg-white dark:bg-slate-900 text-royal-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            ۳۰ روز گذشته (ماه)
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`${
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
          } p-5 rounded-xl border shadow-xs`}
        >
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            دریافتی از مشتریان در این بازه
          </span>
          <div className="text-xl font-black mt-2">
            {accountingStats.totalRevenue.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">تومان</span>
          </div>
        </div>

        <div
          className={`${
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
          } p-5 rounded-xl border shadow-xs`}
        >
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            هزینه قطعات و پیک
          </span>
          <div className="text-xl font-black text-rose-600 mt-2">
            {(
              accountingStats.totalPartCost + accountingStats.totalCourierCost
            ).toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">تومان</span>
          </div>
        </div>

        <div
          className={`${
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
          } p-5 rounded-xl border shadow-xs`}
        >
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            تخفیف کیف پول اعمال‌شده
          </span>
          <div className="text-xl font-black text-amber-600 mt-2">
            {accountingStats.totalWalletDeducted.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">تومان</span>
          </div>
        </div>

        <div className="bg-emerald-900 text-white p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-200 font-medium">
              سود خالص تعمیرات در این بازه
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="text-2xl font-black mt-2">
            {accountingStats.totalProfit.toLocaleString()}{" "}
            <span className="text-xs font-normal text-emerald-200">تومان</span>
          </div>
        </div>
      </div>

      <div
        className={`${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        } rounded-xl shadow-xs border overflow-hidden`}
      >
        <table className="w-full text-right text-sm">
          <thead
            className={`${
              isDarkMode
                ? "bg-slate-900/60 text-slate-300 border-slate-700"
                : "bg-slate-50 text-slate-600 border-slate-200"
            } border-b`}
          >
            <tr>
              <th className="p-4 font-semibold">کد / تاریخ تحویل</th>
              <th className="p-4 font-semibold">مشتری و دستگاه</th>
              <th className="p-4 font-semibold">خدمات انجام‌شده</th>
              <th className="p-4 font-semibold text-center">هزینه قطعه</th>
              <th className="p-4 font-semibold text-center">پیک</th>
              <th className="p-4 font-semibold text-center">دریافتی</th>
              <th className="p-4 font-semibold text-center">سود خالص</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredDeliveredRepairs.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400">
                  تراکنشی در این بازه زمانی ثبت نشده است.
                </td>
              </tr>
            ) : (
              filteredDeliveredRepairs.map((item) => {
                const rec = Number(item.receivedAmount) || 0;
                const part = Number(item.partCost) || 0;
                const cour = Number(item.courierCost) || 0;
                const netProfit = rec - (part + cour);
                return (
                  <tr key={item.id}>
                    <td className="p-4">
                      <div className="font-mono font-bold">{item.id}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.deliveryDate}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold">{item.name}</div>
                      <div className="text-xs text-slate-500">
                        {item.device}
                      </div>
                    </td>
                    <td className="p-4 text-xs">
                      {item.serviceDescription || item.technicalIssue}
                    </td>
                    <td className="p-4 text-center font-mono text-rose-600">
                      {part.toLocaleString()} ت
                    </td>
                    <td className="p-4 text-center font-mono text-rose-600">
                      {cour.toLocaleString()} ت
                    </td>
                    <td className="p-4 text-center font-mono font-bold">
                      {rec.toLocaleString()} ت
                    </td>
                    <td className="p-4 text-center font-bold text-emerald-600">
                      {netProfit.toLocaleString()} ت
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}