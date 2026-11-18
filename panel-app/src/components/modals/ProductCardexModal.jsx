import { useState, useEffect } from "react";
import { X, Boxes, ArrowDownLeft, ArrowUpRight, Wrench } from "lucide-react";

export default function ProductCardexModal({ productId, isOpen, onClose, isDarkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      setLoading(true);
      fetch(`/api/inventory/${productId}/cardex`)
        .then((res) => res.json())
        .then((resData) => setData(resData))
        .catch((err) => console.error("خطا در دریافت کاردکس کالا:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, productId]);

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
            <Boxes className="w-5 h-5 text-royal-900 dark:text-sky-400" />
            کاردکس گردش کالا در انبار:{" "}
            <span className="text-royal-900 dark:text-sky-300">
              {data?.product?.name || "..."}
            </span>
          </h3>
          <button onClick={onClose} className="p-1 hover:text-rose-500 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              در حال بارگذاری گردش انبار...
            </div>
          ) : data?.product ? (
            <>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">موجودی فعلی انبار:</span>
                  <div className="font-black text-base mt-1 text-emerald-600">
                    {data.product.stock} عدد
                  </div>
                </div>
                <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">آخرین قیمت خرید:</span>
                  <div className="font-bold font-mono text-sm mt-1">
                    {(data.product.buyPrice || 0).toLocaleString()} تومان
                  </div>
                </div>
                <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">قیمت فروش مصوب:</span>
                  <div className="font-bold font-mono text-sm mt-1 text-blue-600 dark:text-sky-400">
                    {(data.product.sellPrice || 0).toLocaleString()} تومان
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">تاریخ و سند</th>
                      <th className="p-3">نوع عملیات</th>
                      <th className="p-3">طرف حساب / مشتری</th>
                      <th className="p-3 text-center">تعداد</th>
                      <th className="p-3 text-center">قیمت واحد</th>
                      <th className="p-3">توضیحات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {data.history.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400">
                          هنوز هیچ تراکنش خرید یا فروشی برای این کالا ثبت نشده است.
                        </td>
                      </tr>
                    ) : (
                      data.history.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="p-3">
                            <div className="font-mono font-bold">{row.refId}</div>
                            <div className="text-[10px] text-slate-400 dir-ltr text-right">
                              {row.date}
                            </div>
                          </td>
                          <td className="p-3">
                            {row.type === "in" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                                <ArrowDownLeft className="w-3.5 h-3.5" /> {row.typeLabel}
                              </span>
                            )}
                            {row.type === "out_sale" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
                                <ArrowUpRight className="w-3.5 h-3.5" /> {row.typeLabel}
                              </span>
                            )}
                            {row.type === "out_repair" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold">
                                <Wrench className="w-3.5 h-3.5" /> {row.typeLabel}
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-bold">{row.actorName}</td>
                          <td className="p-3 text-center font-mono font-bold">
                            {row.type === "in" ? `+${row.qty}` : `-${row.qty}`}
                          </td>
                          <td className="p-3 text-center font-mono">
                            {(row.unitPrice || 0).toLocaleString()} ت
                          </td>
                          <td className="p-3 text-slate-500">{row.note}</td>
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