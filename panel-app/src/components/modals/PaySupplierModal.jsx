import { X } from "lucide-react";

export default function PaySupplierModal({
  paySupplierModal,
  setPaySupplierModal,
  onPay,
  isDarkMode,
}) {
  if (!paySupplierModal.isOpen || !paySupplierModal.supplier) return null;

  const currentDebt = Number(paySupplierModal.supplier.debt) || 0;
  const payAmount = Number(paySupplierModal.amount) || 0;
  const remainingDebt = Math.max(0, currentDebt - payAmount);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div
        className={`${
          isDarkMode ? "bg-slate-800 text-slate-100" : "bg-white text-slate-800"
        } rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4`}
      >
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h3 className="font-bold text-sm">
            ثبت پرداخت وجه به: {paySupplierModal.supplier.name}
          </h3>
          <button
            onClick={() =>
              setPaySupplierModal({ ...paySupplierModal, isOpen: false })
            }
          >
            <X className="w-5 h-5 cursor-pointer" />
          </button>
        </div>

        <form onSubmit={onPay} className="space-y-3.5">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs flex justify-between items-center">
            <span>مانده بدهی فعلی ما:</span>
            <b className="text-rose-700 dark:text-rose-300 text-sm font-mono">
              {currentDebt.toLocaleString()} تومان
            </b>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium">
                مبلغ پرداختی فعلی (تومان) *
              </label>
              <button
                type="button"
                onClick={() =>
                  setPaySupplierModal({
                    ...paySupplierModal,
                    amount: String(currentDebt),
                  })
                }
                className="text-[11px] text-royal-600 dark:text-sky-400 underline cursor-pointer"
              >
                انتخاب کل بدهی
              </button>
            </div>
            <input
              required
              type="number"
              min="1000"
              value={paySupplierModal.amount}
              onChange={(e) =>
                setPaySupplierModal({
                  ...paySupplierModal,
                  amount: e.target.value,
                })
              }
              placeholder="مثال: 2000000 (می‌توانید بخشی از بدهی را بپردازید)"
              className="w-full p-2.5 border rounded-lg text-sm font-mono dir-ltr text-right font-bold bg-transparent"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg text-xs flex justify-between items-center">
            <span>مانده بدهی جدید پس از این پرداخت:</span>
            <b
              className={`font-mono text-sm ${
                remainingDebt > 0 ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {remainingDebt.toLocaleString()} تومان
            </b>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              شماره پیگیری / توضیحات پرداخت
            </label>
            <input
              type="text"
              value={paySupplierModal.note}
              onChange={(e) =>
                setPaySupplierModal({
                  ...paySupplierModal,
                  note: e.target.value,
                })
              }
              placeholder="مثال: کارت به کارت علی‌الحساب از بانک ملت"
              className="w-full p-2.5 border rounded-lg text-sm bg-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            ثبت سند پرداخت در کاردکس تأمین‌کننده
          </button>
        </form>
      </div>
    </div>
  );
}