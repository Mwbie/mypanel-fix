import { useState, useMemo } from "react";
import { X, Search, Receipt } from "lucide-react";

export default function SaleModal({
  saleModal,
  setSaleModal,
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

  if (!saleModal.isOpen) return null;

  const selectedProduct = inventory.find((i) => i.id === saleModal.productId);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div
        className={`${
          isDarkMode ? "bg-slate-800 text-slate-100" : "bg-white text-slate-800"
        } rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4`}
      >
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            ثبت فاکتور فروش مستقیم کالا
          </h3>
          <button onClick={() => setSaleModal({ ...saleModal, isOpen: false })}>
            <X className="w-5 h-5 cursor-pointer" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">
              نام خریدار (اختیاری)
            </label>
            <input
              type="text"
              value={saleModal.customerName}
              onChange={(e) =>
                setSaleModal({ ...saleModal, customerName: e.target.value })
              }
              placeholder="مشتری حضوری"
              className="w-full p-2 border rounded-lg text-sm bg-transparent"
            />
          </div>

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
                placeholder="جستجوی نام کالا یا قطعه..."
                className="w-full pr-9 pl-3 py-2 border rounded-lg text-sm bg-transparent"
              />
            </div>

            {showDropdown && (
              <div className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-44 overflow-y-auto">
                {filteredInventory.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setSaleModal({
                        ...saleModal,
                        productId: inv.id,
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
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">تعداد</label>
              <input
                type="number"
                min="1"
                value={saleModal.qty}
                onChange={(e) =>
                  setSaleModal({ ...saleModal, qty: Number(e.target.value) })
                }
                className="w-full p-2 border rounded-lg text-sm font-mono text-center bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                قیمت فروش واحد (تومان)
              </label>
              <input
                type="number"
                value={saleModal.sellPrice}
                onChange={(e) =>
                  setSaleModal({ ...saleModal, sellPrice: e.target.value })
                }
                className="w-full p-2 border rounded-lg text-sm font-mono dir-ltr text-right bg-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            ثبت فروش و کسر از انبار
          </button>
        </form>
      </div>
    </div>
  );
}