const axios = require('axios');
const qs = require('qs');

// اطلاعات پنل پیامک فقط از متغیرهای محیطی (فایل .env) خوانده می‌شود
const getConfig = () => ({
  username: process.env.SMS_USERNAME,
  password: process.env.SMS_PASSWORD,
  sendernumber: process.env.SMS_SENDER,
});

const isSmsConfigured = () => {
  const c = getConfig();
  return Boolean(c.username && c.password && c.sendernumber);
};

const sendSms = async (mobile, textMessage) => {
  if (!isSmsConfigured()) {
    console.warn('[SMS] تنظیمات پیامک (SMS_USERNAME / SMS_PASSWORD / SMS_SENDER) ست نشده؛ پیامک ارسال نشد.');
    return { success: false, error: 'sms_not_configured' };
  }
  const cfg = getConfig();

  try {
    // طبق راهنما: نام کاربری و رمز در کوئری آدرس ارسال می‌شوند
    const url = `https://niksms.com/api/PublicApi/PtpSms?username=${encodeURIComponent(cfg.username)}&password=${encodeURIComponent(cfg.password)}`;
    const cleanMobile = String(mobile).replace(/\D/g, '');

    const postData = {
      message: textMessage,
      numbers: cleanMobile,
      sendernumber: cfg.sendernumber,
      sendtype: 1,
    };

    const response = await axios.post(url, qs.stringify(postData), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    });

    if (response.data && response.data.Status === 0) {
      return { success: true, data: response.data };
    }
    console.error('SMS rejected:', response.data);
    return { success: false, error: response.data };
  } catch (error) {
    // عمداً خود url (که شامل رمز است) لاگ نمی‌شود
    console.error('SMS Send Error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSms, isSmsConfigured };
