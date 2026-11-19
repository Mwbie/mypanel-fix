// اطلاعات پنل پیامک فقط از متغیرهای محیطی (فایل .env) خوانده می‌شود
const getConfig = () => ({
  username: process.env.SMS_USERNAME,
  password: process.env.SMS_PASSWORD,
  // SMS_SENDER اختیاری است — اگر خالی باشد ملی‌پیامک خودش خط فرستنده را انتخاب می‌کند
  sender: process.env.SMS_SENDER || '',
});

const isSmsConfigured = () => {
  const c = getConfig();
  return Boolean(c.username && c.password);
};

const sendSms = async (mobile, textMessage) => {
  if (!isSmsConfigured()) {
    console.warn(`[DEV] پیامک به ${mobile}: ${textMessage}`);
    return { success: false, error: 'sms_not_configured' };
  }
  const cfg = getConfig();
  const cleanMobile = String(mobile).replace(/\D/g, '');

  // ملی‌پیامک REST API
  const url = 'https://rest.payamak-panel.com/api/SendSMS/SendSMS';
  const params = new URLSearchParams({
    username: cfg.username,
    password: cfg.password,
    to: cleanMobile,
    // اگر SMS_SENDER تنظیم نشده، پارامتر from ارسال نمی‌شود تا ملی‌پیامک خط پیش‌فرض را انتخاب کند
    ...(cfg.sender ? { from: cfg.sender } : {}),
    text: textMessage,
    isFlash: 'false',
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();

    // RetStatus === 1 یعنی ارسال موفق
    if (data && data.RetStatus === 1) {
      return { success: true, data };
    }

    console.error('[SMS] ارسال ناموفق:', data);
    return { success: false, error: data };
  } catch (error) {
    console.error('[SMS] خطا در ارسال:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSms, isSmsConfigured };
