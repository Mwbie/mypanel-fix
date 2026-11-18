import {
  Search,
  Filter,
  Plus,
  Clock3,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  Star,
  Trash2,
} from "lucide-react";

const STATUSES = {
  received: {
    label: "پذیرش دستگاه",
    style:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600",
  },
  in_progress: {
    label: "در حال تعمیر",
    style:
      "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
  },
  ready: {
    label: "آماده تحویل",
    style:
      "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700",
  },
  delivered: {
    label: "تحویل مشتری",
    style:
      "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
  },
  unrepairable: {
    label: "غیرقابل تعمیر",
    style:
      "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700",
  },
};

export default function RepairsTab({
  isDarkMode,
  setIsModalOpen,
  dashboardTab,
  setDashboardTab,
  activeRepairsCount,
  archivedRepairsCount,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  displayedDashboardRepairs,
  handleStatusSelectChange,
  handleUseWallet,
  handleDeleteRepair,
}) {
  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <header
        className={`flex flex-col sm:flex-row justify-between items-start sm:items-center ${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        } p-5 rounded-xl shadow-xs border gap-4`}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            پیشخوان تعمیرات ای‌پلاس
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            مدیریت هوشمند دستگاه‌ها، اعلام هزینه آنلاین و زمان حدودی تحویل
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-royal-900 hover:bg-royal-800 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> ثبت پذیرش جدید
        </button>
      </header>

      {/* تب‌بندی دو بخشی پیشخوان */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setDashboardTab("active")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            dashboardTab === "active"
              ? "bg-royal-900 text-white shadow-xs"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          }`}
        >
          <Clock3 className="w-4 h-4" /> دستگاه‌های در جریان ({activeRepairsCount})
        </button>
        <button
          onClick={() => setDashboardTab("archived")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            dashboardTab === "archived"
              ? "bg-royal-900 text-white shadow-xs"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> آرشیو تحویل و عدم تعمیر (
          {archivedRepairsCount})
        </button>
      </div>

      {/* جدول و فیلترها */}
      <div
        className={`${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        } rounded-xl shadow-xs border overflow-hidden flex flex-col`}
      >
        <div
          className={`p-4 border-b ${
            isDarkMode
              ? "border-slate-700 bg-slate-800/60"
              : "border-slate-100 bg-slate-50"
          } flex flex-wrap gap-3 items-center justify-between`}
        >
          <div className="relative w-full md:w-1/3">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="جستجوی نام، شماره، مدل یا ایراد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pr-9 pl-3 py-2 text-sm ${
                isDarkMode
                  ? "bg-slate-900 border-slate-700 text-slate-100"
                  : "bg-white border-slate-300 text-slate-800"
              } border rounded-lg focus:outline-none focus:border-royal-900`}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`py-2 px-3 text-sm ${
                isDarkMode
                  ? "bg-slate-900 border-slate-700 text-slate-100"
                  : "bg-white border-slate-300 text-slate-800"
              } border rounded-lg focus:outline-none focus:border-royal-900 w-full md:w-auto`}
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="received">پذیرش شده</option>
              <option value="in_progress">در حال تعمیر</option>
              <option value="ready">آماده تحویل</option>
              <option value="delivered">تحویل شده</option>
              <option value="unrepairable">غیرقابل تعمیر</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right text-sm">
            <thead
              className={`${
                isDarkMode
                  ? "bg-slate-900/60 text-slate-300 border-slate-700"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              } border-b`}
            >
              <tr>
                <th className="p-4 font-semibold">کد پیگیری</th>
                <th className="p-4 font-semibold">مشتری و دستگاه</th>
                <th className="p-4 font-semibold">ایراد و برآورد هزینه</th>
                <th className="p-4 font-semibold text-center">
                  زمان آماده‌سازی / تحویل
                </th>
                <th className="p-4 font-semibold text-center">وضعیت</th>
                <th className="p-4 font-semibold text-center">کیف پول</th>
                <th className="p-4 font-semibold text-center">رضایت</th>
                <th className="p-4 font-semibold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {displayedDashboardRepairs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    دستگاهی در این بخش یافت نشد.
                  </td>
                </tr>
              ) : (
                displayedDashboardRepairs.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold">{item.id}</td>
                    <td className="p-4">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.device} •{" "}
                        <span className="font-mono">{item.phone}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        پذیرش: {item.receptionDate}
                      </div>
                    </td>
                    <td className="p-4">
                      <div
                        className={`text-xs ${
                          isDarkMode
                            ? "bg-slate-900 text-slate-200"
                            : "bg-slate-100 text-slate-700"
                        } px-2.5 py-1.5 rounded-lg max-w-[230px] leading-relaxed`}
                      >
                        <div>
                          <span className="text-slate-400">اظهار مشتری: </span>
                          {item.issue || "ثبت نشده"}
                        </div>
                        {item.technicalIssue && (
                          <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-700 text-royal-600 dark:text-sky-400 font-medium">
                            تشخیص: {item.technicalIssue}
                          </div>
                        )}
                      </div>
                      {item.estimatedCost > 0 && (
                        <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                          <span className="text-xs font-bold">
                            هزینه: {item.estimatedCost.toLocaleString()} ت
                          </span>
                          {item.costApproved === "approved" && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold border border-emerald-200 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> تایید شد
                            </span>
                          )}
                          {item.costApproved === "rejected" && (
                            <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-semibold border border-rose-200 flex items-center gap-0.5">
                              <XCircle className="w-3 h-3" /> رد شد
                            </span>
                          )}
                          {item.costApproved === "pending" && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-semibold border border-amber-200 flex items-center gap-0.5">
                              <Clock3 className="w-3 h-3" /> منتظر تایید
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {item.status === "in_progress" &&
                        item.estimatedReadyTime && (
                          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md inline-block">
                            حدودی: {item.estimatedReadyTime}
                          </div>
                        )}
                      {item.status === "ready" && (
                        <div className="text-xs font-bold text-emerald-600">
                          آماده: {item.readyDate || "ثبت شد"}
                        </div>
                      )}
                      {item.status === "delivered" && (
                        <div className="text-xs text-blue-600 dark:text-sky-400 font-mono">
                          {item.deliveryDate}
                        </div>
                      )}
                      {item.status === "unrepairable" && (
                        <div className="text-xs text-rose-600 font-bold">
                          غیرقابل تعمیر
                        </div>
                      )}
                      {item.status === "received" && (
                        <span className="text-xs text-slate-400">
                          در نوبت بررسی
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusSelectChange(item, e.target.value)
                          }
                          className={`text-xs font-semibold rounded-full px-3 py-1.5 border outline-none cursor-pointer appearance-none text-center ${
                            STATUSES[item.status]?.style || ""
                          }`}
                        >
                          {Object.entries(STATUSES).map(([key, val]) => (
                            <option
                              key={key}
                              value={key}
                              className="bg-white text-slate-800"
                            >
                              {val.label}
                            </option>
                          ))}
                        </select>
                        {(item.status === "in_progress" ||
                          item.status === "delivered") && (
                          <button
                            onClick={() =>
                              handleStatusSelectChange(item, item.status)
                            }
                            className="text-[10px] text-slate-400 hover:text-royal-600 flex items-center gap-0.5 mt-0.5 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" /> ویرایش
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {item.walletBalance > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.walletBalance.toLocaleString()} ت
                          </span>
                          <button
                            onClick={() =>
                              handleUseWallet(
                                item.phone,
                                item.name,
                                item.walletBalance
                              )
                            }
                            className="text-[10px] text-royal-600 dark:text-sky-400 underline cursor-pointer"
                          >
                            کسر
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">۰</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {item.satisfaction ? (
                        <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {item.satisfaction}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() =>
                          handleDeleteRepair(item.id, item.name, item.device)
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}