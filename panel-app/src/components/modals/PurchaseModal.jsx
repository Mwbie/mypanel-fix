import { useState, useMemo } from "react";
import { X, Search, ShoppingCart } from "lucide-react";

export default function PurchaseModal({
  purchaseModal,
  setPurchaseModal,
  suppliers,
  inventory,
  onSave,
  isDarkMode,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventory;
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventory, searchQuery]);

  if (!purchaseModal.isOpen) return null;

  const selectedProduct = inventory.find(
    (i) => i.id === purchaseModal.productId
  );
  const totalInvoice =
    (Number(purchaseModal.buyPrice) || 0) * (Number(purchaseModal.qty) || 1);
  const paid =
    purchaseModal.paidAmount !== ""
      ? Number(purchaseModal.paidAmount)
      : totalInvoice;
  const remainingDebt = Math.max(0, totalInvoice - paid);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div
        className={`${
          isDarkMode ? "bg-slate-800 text-slate-100" : "bg-white text-slate-800"
        } rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4`}
      >
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            ثبت فاکتور خرید قطعه از تأمین‌کننده
          </h3>
          <button
            onClick={() =>
              setPurchaseModal({ ...purchaseModal, isOpen: false })
            }
          >
            <X className="w-5 h-5 cursor-pointer" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">
              انتخاب تأمین‌کننده قطعات *
            </label>
            <select
              required
              value={purchaseModal.supplierId}
              onChange={(e) =>
                setPurchaseModal({
                  ...purchaseModal,
                  supplierId: e.target.value,
                })
              }
              className="w-full p-2.5 border rounded-lg text-sm bg-white dark:bg-slate-900"
            >
              <option value="">انتخاب طرف حساب...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (بدهی فعلی: {(s.debt || 0).toLocaleString()} ت)
                </option>
              ))}
            </select>
          </div>

          {/* باکس سرچ هوشمند کالا در انبار */}
          <div className="relative">
            <label className="block text-xs font-medium mb-1">
              جستجو و انتخاب کالا از انبار *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={
                  showDropdown
                    ? searchQuery
                    : selectedProduct
                    ? selectedProduct.name
                    : searchQuery
                }
                onFocus={() => {
                  setSearchQuery("");
                  setShowDropdown(true);
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                placeholder="نام قطعه یا مدل گوشی را تایپ کنید..."
                className="w-full pr-9 pl-3 py-2 border rounded-lg text-sm bg-transparent"
              />
            </div>

            {showDropdown && (
              <div className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-44 overflow-y-auto">
                {filteredInventory.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">
                    کالایی با این نام در انبار یافت نشد.
                  </div>
                ) : (
                  filteredInventory.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => {
                        setPurchaseModal({
                          ...purchaseModal,
                          productId: inv.id,
                          buyPrice: String(inv.buyPrice || ""),
                          sellPrice: String(inv.sellPrice || ""),
                        });
                        setSearchQuery(inv.name);
                        setShowDropdown(false);
                      }}
                      className="p-2.5 text-xs hover:bg-royal-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center border-b border-slate-100 dark:border-slate-800"
                    >
                      <span className="font-bold">{inv.name}</span>
                      <span className="text-slate-400 font-mono">
                        موجودی: {inv.stock}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                تعداد خرید
              </label>
              <input
                type="number"
                min="1"
                value={purchaseModal.qty}
                onChange={(e) =>
                  setPurchaseModal({
                    ...purchaseModal,
                    qty: Number(e.target.value),
                  })
                }
                className="w-full p-2 border rounded-lg text-sm font-mono text-center bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                قیمت خرید واحد (تومان) *
              </label>
              <input
                required
                type="number"
                value={purchaseModal.buyPrice}
                onChange={(e) =>
                  setPurchaseModal({
                    ...purchaseModal,
                    buyPrice: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg text-sm font-mono dir-ltr text-right bg-transparent"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span>جمع کل فاکتور:</span>
              <b className="font-mono text-sm">
                {totalInvoice.toLocaleString()} تومان
              </b>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium">مبلغ پرداختی نقدی الان:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPurchaseModal({ ...purchaseModal, paidAmount: "0" })
                    }
                    className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 rounded font-bold cursor-pointer"
                  >
                    تمام نسیه (۰ ریال)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPurchaseModal({
                        ...purchaseModal,
                        paidAmount: String(totalInvoice),
                      })
                    }
                    className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold cursor-pointer"
                  >
                    تمام نقد
                  </button>
                </div>
              </div>
              <input
                type="number"
                value={purchaseModal.paidAmount}
                onChange={(e) =>
                  setPurchaseModal({
                    ...purchaseModal,
                    paidAmount: e.target.value,
                  })
                }
                placeholder="اگر نسیه است عدد 0 یا مبلغ پیش‌پرداخت را بزنید"
                className="w-full p-2 border rounded-lg text-sm font-mono dir-ltr text-right bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex justify-between items-center pt-1 border-t">
              <span>مبلغ نسیه (اضافه شونده به حساب تأمین‌کننده):</span>
              <b
                className={`font-mono text-sm ${
                  remainingDebt > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {remainingDebt.toLocaleString()} تومان
              </b>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            ثبت فاکتور خرید و اعمال در کاردکس
          </button>
        </form>
      </div>
    </div>
  );
}