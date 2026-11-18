import { Truck, Plus, FileText, Edit3, Trash2 } from "lucide-react";

export default function SuppliersTab({
  isDarkMode,
  suppliers,
  totalSupplierDebt,
  setSupplierModal,
  setSupplierCardexModal,
  setPaySupplierModal,
  handleDeleteSupplier,
}) {
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <header
        className={`${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        } p-5 rounded-xl border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6 text-royal-900 dark:text-sky-400" />{" "}
            تأمین‌کنندگان قطعات و حساب دفتری
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مدیریت طرف‌حساب‌ها، مشاهده کاردکس فاکتورهای خرید، و ثبت پرداخت‌های علی‌الحساب و نسیه
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs">
            <span className="text-rose-700 dark:text-rose-300">
              مجموع بدهی نسیه ما:{" "}
            </span>
            <b className="text-sm font-black font-mono text-rose-700 dark:text-rose-300">
              {totalSupplierDebt.toLocaleString()} تومان
            </b>
          </div>

          <button
            onClick={() =>
              setSupplierModal({
                isOpen: true,
                id: null,
                name: "",
                phone: "",
                address: "",
                initialDebt: "0",
              })
            }
            className="px-4 py-2.5 bg-royal-900 hover:bg-royal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> تأمین‌کننده جدید
          </button>
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
              <th className="p-4">نام فروشگاه / تأمین‌کننده قطعات</th>
              <th className="p-4">شماره تماس و آدرس</th>
              <th className="p-4 text-center">مجموع خریدها</th>
              <th className="p-4 text-center">مانده بدهی نسیه ما</th>
              <th className="p-4 text-center">کاردکس و ریز حساب</th>
              <th className="p-4 text-center">عملیات مالی</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {suppliers.map((s) => (
              <tr
                key={s.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-700/40"
              >
                <td
                  onClick={() =>
                    setSupplierCardexModal({
                      isOpen: true,
                      supplierId: s.id,
                    })
                  }
                  className="p-4 font-bold text-royal-900 dark:text-sky-300 hover:underline cursor-pointer"
                >
                  {s.name}
                </td>
                <td className="p-4">
                  <div className="font-mono text-xs">{s.phone}</div>
                  <div className="text-[11px] text-slate-400">{s.address}</div>
                </td>
                <td className="p-4 text-center font-mono">
                  {(s.totalPurchases || 0).toLocaleString()} ت
                </td>
                <td className="p-4 text-center">
                  {s.debt > 0 ? (
                    <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold font-mono text-xs">
                      {s.debt.toLocaleString()} ت بدهکاریم
                    </span>
                  ) : (
                    <span className="text-emerald-600 text-xs font-bold">
                      بی‌حساب (تسویه)
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() =>
                      setSupplierCardexModal({
                        isOpen: true,
                        supplierId: s.id,
                      })
                    }
                    className="px-3 py-1.5 bg-royal-50 hover:bg-royal-100 text-royal-900 dark:bg-slate-700 dark:text-sky-300 rounded-lg text-xs font-bold flex items-center gap-1 mx-auto cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> کاردکس حساب
                  </button>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() =>
                        setPaySupplierModal({
                          isOpen: true,
                          supplier: s,
                          amount: "",
                          note: "",
                        })
                      }
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      پرداخت / تسویه
                    </button>
                    <button
                      onClick={() =>
                        setSupplierModal({
                          isOpen: true,
                          id: s.id,
                          name: s.name,
                          phone: s.phone,
                          address: s.address,
                          initialDebt: String(s.debt || 0),
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-royal-600 cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(s.id, s.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}