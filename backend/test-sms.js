#!/usr/bin/env node
/**
 * اسکریپت تست ارسال پیامک
 *
 * اجرا:
 *   node backend/test-sms.js 09XXXXXXXXX
 *
 * پیش‌نیاز: مقادیر SMS_USERNAME، SMS_PASSWORD، SMS_SENDER در backend/.env تنظیم باشند
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { sendSms, isSmsConfigured } = require('./smsService');

const phone = process.argv[2];

if (!phone || !/^09\d{9}$/.test(phone.replace(/\D/g, ''))) {
  console.error('❌ شماره موبایل معتبر وارد کنید.\nمثال: node backend/test-sms.js 09120000000');
  process.exit(1);
}

if (!isSmsConfigured()) {
  console.error('❌ پنل پیامک تنظیم نشده.\nمقادیر SMS_USERNAME، SMS_PASSWORD و SMS_SENDER را در backend/.env وارد کنید.');
  process.exit(1);
}

console.log(`📤 در حال ارسال پیامک تست به ${phone}...`);

sendSms(phone, 'ای‌پلاس: این یک پیامک آزمایشی است. سرویس پیامک با موفقیت تنظیم شده.')
  .then((result) => {
    if (result.success) {
      console.log('✅ پیامک با موفقیت ارسال شد:', result.data);
    } else {
      console.error('❌ ارسال ناموفق:', result.error);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('❌ خطای غیرمنتظره:', err.message);
    process.exit(1);
  });
