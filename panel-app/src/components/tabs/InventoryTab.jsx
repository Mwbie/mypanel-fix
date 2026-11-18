import { useState, useMemo } from "react";
import {
  Boxes,
  Plus,
  ShoppingCart,
  Receipt,
  AlertTriangle,
  Search,
  History,
  Edit3,
  Trash2,
} from "lucide-react";

export default function InventoryTab({
  isDarkMode,
  inventory,
  purchases,
  sales,
  suppliers,
  lowStockItems,
  setItemModal,
  setPurchaseModal,
  setSaleModal,
  setProductCardexModal,
  handleDeleteInventory,
}) {
  const [inventorySubTab, setInventorySubTab] = useState("stock");
  const [inventorySearch, setInventorySearch] = useState("");

  const filteredStockList = useMemo(() => {
    if (!inventorySearch.trim()) return inventory;
    return inventory.filter(
      (i) =>
        i.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        i.id.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        (i.category && i.category.includes(inventorySearch))
    );
  }, [inventory, inventorySearch]);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <header
        className={`${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        } p-5 rounded-xl border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Boxes className="w-6 h-6 text-royal-900 dark:text-sky-400" />{" "}
            مدیریت انبار، خرید و فروش قطعات
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            کنترل موجودی قطعات، کاردکس ورود/خروج هر کالا، فاکتورهای خرید نقد/نسیه و فروش مستقیم
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() =>
              setItemModal({
                isOpen: true,
                id: null,
                name: "",
                category: "قطعات تعمیراتی",
                stock: "",
                minStock: "1",
                buyPrice: "",
                sellPrice: "",
              })
            }
            className="px-3.5 py-2 bg-royal-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> تعریف کالای جدید
          </button>
          <button
            onClick={() =>
              setPurchaseModal({
                isOpen: true,
                supplierId: suppliers[0]?.id || "",
                productId: "",
                qty: 1,
                buyPrice: "",
                sellPrice: "",
                paidAmount: "",
                note: "",
              })
            }
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" /> ثبت فاکتور خرید
          </button>
          <button
            onClick={() =>
              setSaleModal({
                isOpen: true,
                customerName: "",
                customerPhone: "",
                productId: "",
                qty: 1,
                sellPrice: "",
                note: "",
              })
            }
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Receipt className="w-4 h-4" /> ثبت فاکتور فروش
          </button>
        </div>
      </header>

      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-amber-900 dark:text-amber-300 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>
            <b>هشدار کسری موجودی:</b> تعداد <b>{lowStockItems.length} کالا</b>{" "}
            به حد اتمام موجودی رسیده‌اند:{" "}
            {lowStockItems.map((i) => i.name).join("، ")}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setInventorySubTab("stock")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              inventorySubTab === "stock"
                ? "bg-royal-900 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            موجودی انبار ({inventory.length})
          </button>
          <button
            onClick={() => setInventorySubTab("purchases")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              inventorySubTab === "purchases"
                ? "bg-royal-900 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            فاکتورهای خرید ({purchases.length})
          </button>
          <button
            onClick={() => setInventorySubTab("sales")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              inventorySubTab === "sales"
                ? "bg-royal-900 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            فاکتورهای فروش مستقیم ({sales.length})
          </button>
        </div>

        {inventorySubTab === "stock" && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              placeholder="جستجوی نام قطعه یا کد کالا..."
              className="w-full pr-9 pl-3 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-lg"
            />
          </div>
        )}
      </div>

      {/* جدول ۱: موجودی انبار */}
      {inventorySubTab === "stock" && (
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
                <th className="p-4">کد / نام کالا</th>
                <th className="p-4">دسته‌بندی</th>
                <th className="p-4 text-center">موجودی فعلی</th>
                <th className="p-4 text-center">قیمت خرید</th>
                <th className="p-4 text-center">قیمت فروش</th>
                <th className="p-4 text-center">کاردکس گردش</th>
                <th className="p-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredStockList.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  <td
                    onClick={() =>
                      setProductCardexModal({
                        isOpen: true,
                        productId: item.id,
                      })
                    }
                    className="p-4 cursor-pointer"
                  >
                    <span className="font-mono text-xs text-slate-400 ml-2">
                      {item.id}
                    </span>
                    <span className="font-bold text-royal-900 dark:text-sky-300 hover:underline">
                      {item.name}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {item.category}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.stock <= item.minStock
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.stock} عدد
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono">
                    {item.buyPrice.toLocaleString()} ت
                  </td>
                  <td className="p-4 text-center font-mono font-bold">
                    {item.sellPrice.toLocaleString()} ت
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() =>
                        setProductCardexModal({
                          isOpen: true,
                          productId: item.id,
                        })
                      }
                      className="px-3 py-1.5 bg-royal-50 hover:bg-royal-100 text-royal-900 dark:bg-slate-700 dark:text-sky-300 rounded-lg text-xs font-bold flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" /> کاردکس کالا
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() =>
                          setItemModal({
                            isOpen: true,
                            id: item.id,
                            name: item.name,
                            category: item.category,
                            stock: String(item.stock),
                            minStock: String(item.minStock),
                            buyPrice: String(item.buyPrice),
                            sellPrice: String(item.sellPrice),
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-royal-600 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInventory(item.id, item.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
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
      )}

      {/* جدول ۲: فاکتورهای خرید */}
      {inventorySubTab === "purchases" && (
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
                <th className="p-4">شماره فاکتور / تاریخ</th>
                <th className="p-4">تأمین‌کننده قطعات</th>
                <th className="p-4">اقلام خریداری‌شده</th>
                <th className="p-4 text-center">مبلغ کل فاکتور</th>
                <th className="p-4 text-center">پرداخت نقدی</th>
                <th className="p-4 text-center">مانده نسیه فاکتور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {purchases.map((p) => (
                <tr key={p.id}>
                  <td className="p-4">
                    <div className="font-mono font-bold">{p.id}</div>
                    <div className="text-[11px] text-slate-400">{p.date}</div>
                  </td>
                  <td className="p-4 font-bold">{p.supplierName}</td>
                  <td className="p-4 text-xs">
                    {p.items?.map((it, idx) => (
                      <div key={idx}>
                        {it.name} ({it.qty} عدد - واحد:{" "}
                        {it.buyPrice.toLocaleString()} ت)
                      </div>
                    ))}
                  </td>
                  <td className="p-4 text-center font-bold font-mono">
                    {p.totalAmount.toLocaleString()} ت
                  </td>
                  <td className="p-4 text-center text-emerald-600 font-mono">
                    {p.paidAmount.toLocaleString()} ت
                  </td>
                  <td className="p-4 text-center">
                    {p.debtAmount > 0 ? (
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold font-mono">
                        {p.debtAmount.toLocaleString()} ت نسیه
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-600 font-bold">
                        تسویه نقدی
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* جدول ۳: فاکتورهای فروش مستقیم */}
      {inventorySubTab === "sales" && (
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
                <th className="p-4">شماره / تاریخ</th>
                <th className="p-4">مشتری</th>
                <th className="p-4">کالای فروخته‌شده</th>
                <th className="p-4 text-center">مبلغ فروش</th>
                <th className="p-4 text-center">سود خالص</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="p-4">
                    <div className="font-mono font-bold">{s.id}</div>
                    <div className="text-[11px] text-slate-400">{s.date}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold">{s.customerName}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      {s.customerPhone}
                    </div>
                  </td>
                  <td className="p-4 text-xs">
                    {s.items?.map((it, idx) => (
                      <div key={idx}>
                        {it.name} ({it.qty} عدد)
                      </div>
                    ))}
                  </td>
                  <td className="p-4 text-center font-bold font-mono">
                    {s.totalAmount.toLocaleString()} ت
                  </td>
                  <td className="p-4 text-center font-bold font-mono text-emerald-600">
                    {s.profit.toLocaleString()} ت
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}