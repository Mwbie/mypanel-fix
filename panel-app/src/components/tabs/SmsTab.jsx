import { MessageSquare, Send } from "lucide-react";

export default function SmsTab({
  isDarkMode,
  displayedDashboardRepairs,
  selectedIds,
  toggleSelectAll,
  toggleSelectOne,
  smsMessage,
  setSmsMessage,
  handleSendSms,
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <header
        className={`${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        } p-5 rounded-xl shadow-xs border`}
      >
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-royal-900 dark:text-sky-400" />{" "}
          پنل پیامک و اطلاع‌رسانی
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          className={`${
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
          } p-5 rounded-xl shadow-xs border flex flex-col h-[480px]`}
        >
          <h3 className="font-bold text-sm mb-3">انتخاب گیرندگان</h3>
          <div className="overflow-y-auto flex-1 border border-slate-100 dark:border-slate-700 rounded-lg">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                <tr>
                  <th className="p-2 pr-3 w-8">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={
                        selectedIds.length ===
                          displayedDashboardRepairs.length &&
                        displayedDashboardRepairs.length > 0
                      }
                      className="rounded accent-royal-900"
                    />
                  </th>
                  <th className="p-2">نام مشتری</th>
                  <th className="p-2">دستگاه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {displayedDashboardRepairs.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => toggleSelectOne(item.id)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer"
                  >
                    <td className="p-2 pr-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelectOne(item.id)}
                        className="rounded accent-royal-900"
                      />
                    </td>
                    <td className="p-2 font-medium">{item.name}</td>
                    <td className="p-2 text-slate-500">{item.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className={`${
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
          } p-5 rounded-xl shadow-xs border flex flex-col`}
        >
          <form
            onSubmit={handleSendSms}
            className="flex flex-col h-full space-y-4"
          >
            <div>
              <label className="block text-xs font-medium mb-1">
                تعداد گیرندگان انتخاب‌شده:
              </label>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-bold text-royal-600 dark:text-sky-400 text-sm">
                {selectedIds.length} نفر
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-medium mb-1">
                متن پیامک:
              </label>
              <textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="متن اطلاع‌رسانی یا تخفیف..."
                className={`w-full flex-1 p-3 text-sm ${
                  isDarkMode
                    ? "bg-slate-900 border-slate-700 text-slate-100"
                    : "bg-white border-slate-300 text-slate-800"
                } border rounded-lg resize-none min-h-[140px] focus:outline-none`}
              />
            </div>
            <button
              type="submit"
              disabled={selectedIds.length === 0 || !smsMessage.trim()}
              className="w-full bg-royal-900 hover:bg-royal-800 disabled:bg-slate-400 text-white font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" /> ارسال پیامک
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}