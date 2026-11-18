import { useState } from "react";
import { Settings, Trash2 } from "lucide-react";

const PERMISSION_OPTIONS = [
  { id: "dashboard", label: "پیشخوان تعمیرات و پذیرش" },
  { id: "customers", label: "لیست مشتریان و سوابق" },
  { id: "inventory", label: "انبار، خرید و فروش" },
  { id: "suppliers", label: "تأمین‌کنندگان قطعات" },
  { id: "accounting", label: "حسابداری و گزارش مالی" },
  { id: "sms", label: "باشگاه مشتریان و پیامک" },
  { id: "settings", label: "تنظیمات و پرسنل" },
];

const normalizePhone = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .trim();
};

export default function SettingsTab({ isDarkMode, staffList, fetchData }) {
  const [staffForm, setStaffForm] = useState({
    name: "",
    phone: "",
    permissions: ["dashboard"],
  });

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    const clean = normalizePhone(staffForm.phone);
    if (!staffForm.name || !clean) return;
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: staffForm.name,
        phone: clean,
        permissions: staffForm.permissions,
      }),
    });
    if (res.ok) {
      setStaffForm({
        name: "",
        phone: "",
        permissions: ["dashboard"],
      });
      fetchData();
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`آیا از حذف همکار «${name}» مطمئن هستید؟`)) return;
    const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header
        className={`${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        } p-5 rounded-xl shadow-xs border flex justify-between items-center`}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-royal-900 dark:text-sky-400" />{" "}
            تنظیمات و دسترسی پرسنل
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تعریف همکاران و تعیین دقیق سطح دسترسی به هر بخش سیستم
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div
          className={`lg:col-span-2 ${
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
          } p-5 rounded-xl border shadow-xs space-y-4`}
        >
          <h3 className="font-bold text-sm">افزودن / ویرایش همکار</h3>
          <form onSubmit={handleSaveStaff} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                نام و عنوان شغلی
              </label>
              <input
                required
                type="text"
                value={staffForm.name}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, name: e.target.value })
                }
                placeholder="مثال: علی حسینی (تعمیرکار)"
                className="w-full p-2 border rounded-lg text-xs bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                شماره موبایل جهت ورود
              </label>
              <input
                required
                type="tel"
                value={staffForm.phone}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, phone: e.target.value })
                }
                placeholder="0912..."
                className="w-full p-2 border rounded-lg text-xs dir-ltr text-right bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                دسترسی‌های مجاز:
              </label>
              <div className="p-2.5 border rounded-lg space-y-1.5 text-xs bg-slate-50 dark:bg-slate-900">
                {PERMISSION_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={staffForm.permissions.includes(opt.id)}
                      onChange={() => {
                        const exists = staffForm.permissions.includes(opt.id);
                        setStaffForm({
                          ...staffForm,
                          permissions: exists
                            ? staffForm.permissions.filter((p) => p !== opt.id)
                            : [...staffForm.permissions, opt.id],
                        });
                      }}
                      className="rounded accent-royal-900"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-royal-900 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              ثبت پرسنل
            </button>
          </form>
        </div>

        <div
          className={`lg:col-span-3 ${
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
          } p-5 rounded-xl border shadow-xs`}
        >
          <h3 className="font-bold text-sm mb-3">لیست همکاران</h3>
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b">
              <tr>
                <th className="p-3">نام</th>
                <th className="p-3">موبایل</th>
                <th className="p-3">دسترسی‌ها</th>
                <th className="p-3 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {staffList.map((m) => (
                <tr key={m.id}>
                  <td className="p-3 font-bold">{m.name}</td>
                  <td className="p-3 font-mono">{m.phone}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {m.permissions?.map((p) => (
                        <span
                          key={p}
                          className="px-1.5 py-0.5 bg-royal-50 text-royal-900 dark:bg-slate-700 dark:text-sky-300 rounded text-[10px]"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteStaff(m.id, m.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}