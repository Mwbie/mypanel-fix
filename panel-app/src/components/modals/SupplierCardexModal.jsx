import { useState, useEffect } from "react";
import { X, Truck, ShoppingCart, CheckCircle2 } from "lucide-react";

export default function SupplierCardexModal({ supplierId, isOpen, onClose, isDarkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && supplierId) {
      setLoading(true);
      fetch(`/api/suppliers/${supplierId}/cardex`)
        .then((res) => res.json())
        .then((resData) => setData(resData))
        .catch((err) => console.error("خطا در دریافت کاردکس تأمین‌کننده:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, supplierId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div
        className={`${
          isDarkMode ? "bg-slate-800 text-slate-100" : "bg-white text-slate-800"
        } rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh]`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-royal-50 dark:bg-slate-900">
          <h3 className="font-bold text-sm md:text-base flex items-center gap-2">
            <Truck className="w-5 h-5 text-royal-900 dark:text-sky-400" />
            کاردکس و ریز حساب تأمین‌کننده:{" "}
            <span className="text-royal-900 dark:text-sky-300">
              {data?.supplier?.name || "..."}
            </span>
          </h3>
          <button onClick={onClose} className="p-1 hover:text-rose-500 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              در حال دریافت صورت‌حساب...
            </div>
          ) : data?.supplier ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">شماره تماس و آدرس:</span>
                  <div className="font-bold font-mono mt-1">{data.supplier.phone || "-"}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{data.supplier.address}</div>
                </div>
                <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">حجم کل خریدها تا امروز:</span>
                  <div className="font-black text-base font-mono mt-1">
                    {(data.supplier.totalPurchases || 0).toLocaleString()} تومان
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900">
                  <span className="text-rose-600 dark:text-rose-300">مانده بدهی نسیه فعلی ما:</span>
                  <div className="font-black text-base font-mono mt-1 text-rose-700 dark:text-rose-300">
                    {(data.supplier.debt || 0).toLocaleString()} تومان
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">شماره سند / تاریخ</th>
                      <th className="p-3">نوع تراکنش</th>
                      <th className="p-3">شرح اقلام یا توضیحات</th>
                      <th className="p-3 text-center">مبلغ کل فاکتور</th>
                      <th className="p-3 text-center">پرداختی ما</th>
                      <th className="p-3 text-center">مانده نسیه فاکتور</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {data.transactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400">
                          هیچ فاکتور یا پرداختی برای این تأمین‌کننده ثبت نشده است.
                        </td>
                      </tr>
                    ) : (
                      data.transactions.map((tr) => (
                        <tr key={tr.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="p-3">
                            <div className="font-mono font-bold">{tr.id}</div>
                            <div className="text-[10px] text-slate-400 dir-ltr text-right">
                              {tr.date}
                            </div>
                          </td>
                          <td className="p-3">
                            {tr.type === "purchase" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold">
                                <ShoppingCart className="w-3.5 h-3.5" /> فاکتور خرید قطعه
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> پرداخت / تسویه بدهی
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {tr.type === "purchase" ? (
                              <div className="space-y-0.5">
                                {tr.items?.map((it, i) => (
                                  <div key={i} className="font-bold">
                                    • {it.name} ({it.qty} عدد - واحد: {it.buyPrice.toLocaleString()} ت)
                                  </div>
                                ))}
                                {tr.note && <div className="text-slate-400 text-[11px]">{tr.note}</div>}
                              </div>
                            ) : (
                              <span className="font-medium text-emerald-700 dark:text-emerald-300">
                                {tr.note}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-bold">
                            {tr.type === "purchase" ? `${tr.totalAmount.toLocaleString()} ت` : "-"}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-600">
                            {tr.type === "purchase"
                              ? `${tr.paidAmount.toLocaleString()} ت`
                              : `${tr.amount.toLocaleString()} ت`}
                          </td>
                          <td className="p-3 text-center font-mono">
                            {tr.type === "purchase" ? (
                              tr.debtAmount > 0 ? (
                                <span className="text-rose-600 font-bold">
                                  {tr.debtAmount.toLocaleString()} ت نسیه
                                </span>
                              ) : (
                                <span className="text-emerald-600">نقد / تسویه</span>
                              )
                            ) : (
                              <span className="text-emerald-600 font-bold">کسر از بدهی</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}