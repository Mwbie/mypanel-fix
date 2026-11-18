import { Users, Star, Eye } from "lucide-react";

export default function CustomersTab({
  isDarkMode,
  customers,
  setCustomerProfileModal,
}) {
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <header
        className={`${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        } p-5 rounded-xl border shadow-xs flex justify-between items-center`}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-royal-900 dark:text-sky-400" />{" "}
            پرونده و سوابق مشتریان ای‌پلاس
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            کلیک روی نام یا دکمه مشاهده برای دیدن تمام مراجعات، دستگاه‌ها و میزان رضایت مشتری
          </p>
        </div>
      </header>

      <div
        className={`${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        } rounded-xl border shadow-xs overflow-hidden`}
      >
        <table className="w-full text-right text-sm">
          <thead
            className={`${
              isDarkMode
                ? "bg-slate-900 text-slate-300"
                : "bg-slate-50 text-slate-600"
            } border-b`}
          >
            <tr>
              <th className="p-4">نام مشتری</th>
              <th className="p-4">شماره موبایل</th>
              <th className="p-4 text-center">کد معرف</th>
              <th className="p-4 text-center">موجودی کیف پول</th>
              <th className="p-4 text-center">تعداد مراجعات</th>
              <th className="p-4 text-center">میانگین رضایت</th>
              <th className="p-4 text-center">سوابق کامل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {customers.map((c) => (
              <tr
                key={c.phone}
                onClick={() =>
                  setCustomerProfileModal({ isOpen: true, customer: c })
                }
                className="hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer"
              >
                <td className="p-4 font-bold text-royal-900 dark:text-sky-300">
                  {c.name}
                </td>
                <td className="p-4 font-mono text-slate-600 dark:text-slate-300">
                  {c.phone}
                </td>
                <td className="p-4 text-center font-mono font-bold">
                  {c.referralCode || "-"}
                </td>
                <td className="p-4 text-center font-bold text-emerald-600">
                  {(c.walletBalance || 0).toLocaleString()} تومان
                </td>
                <td className="p-4 text-center">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-bold">
                    {c.totalRepairs || 0} دستگاه
                  </span>
                </td>
                <td className="p-4 text-center">
                  {c.avgSatisfaction ? (
                    <div className="flex items-center justify-center gap-1 text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-current" />
                      {c.avgSatisfaction}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">بدون نظر</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomerProfileModal({
                        isOpen: true,
                        customer: c,
                      });
                    }}
                    className="px-3 py-1.5 bg-royal-50 hover:bg-royal-100 text-royal-900 dark:bg-slate-700 dark:text-sky-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> مشاهده پرونده
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}