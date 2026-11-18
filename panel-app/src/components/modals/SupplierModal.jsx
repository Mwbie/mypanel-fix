import { X, Truck } from "lucide-react";

export default function SupplierModal({
  supplierModal,
  setSupplierModal,
  onSave,
  isDarkMode,
}) {
  if (!supplierModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div
        className={`${
          isDarkMode ? "bg-slate-800 text-slate-100" : "bg-white text-slate-800"
        } rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4`}
      >
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Truck className="w-4 h-4 text-royal-900 dark:text-sky-400" />
            {supplierModal.id ? "ویرایش مشخصات تأمین‌کننده" : "تعریف تأمین‌کننده قطعات جدید"}
          </h3>
          <button
            onClick={() => setSupplierModal({ ...supplierModal, isOpen: false })}
          >
            <X className="w-5 h-5 cursor-pointer" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">
              نام فروشگاه / طرف حساب *
            </label>
            <input
              required
              type="text"
              value={supplierModal.name}
              onChange={(e) =>
                setSupplierModal({ ...supplierModal, name: e.target.value })
              }
              placeholder="مثال: بازرگانی قطعات پارس (آقای کریمی)"
              className="w-full p-2.5 border rounded-lg text-sm bg-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">شماره تماس</label>
            <input
              type="tel"
              value={supplierModal.phone}
              onChange={(e) =>
                setSupplierModal({ ...supplierModal, phone: e.target.value })
              }
              placeholder="0912..."
              className="w-full p-2.5 border rounded-lg text-sm dir-ltr text-right font-mono bg-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">آدرس فروشگاه</label>
            <input
              type="text"
              value={supplierModal.address}
              onChange={(e) =>
                setSupplierModal({ ...supplierModal, address: e.target.value })
              }
              placeholder="مثال: پاساژ علاءالدین، طبقه ۴، پلاک ۴۱۲"
              className="w-full p-2.5 border rounded-lg text-sm bg-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              مانده بدهی قبلی / اول دوره (تومان)
            </label>
            <input
              type="number"
              value={supplierModal.initialDebt}
              onChange={(e) =>
                setSupplierModal({
                  ...supplierModal,
                  initialDebt: e.target.value,
                })
              }
              placeholder="0"
              className="w-full p-2.5 border rounded-lg text-sm dir-ltr text-right font-mono bg-transparent"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() =>
                setSupplierModal({ ...supplierModal, isOpen: false })
              }
              className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-royal-900 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              ثبت طرف حساب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}