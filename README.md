# A Plus Panel

پنل مدیریت تعمیرگاه (پذیرش، انبار، تأمین‌کنندگان، حسابداری، پنل مشتری).

## اجرا (توسعه)
```bash
cd backend && cp .env.example .env   # مقادیر را پر کنید (ADMIN_PHONE, SMS_*, ...)
npm install && npm run dev           # http://localhost:5000
cd ../panel-app && npm install && npm run dev   # http://localhost:5173 (پروکسی /api به 5000)
```
بدون تنظیم `SMS_*` در حالت توسعه، کد ورود (OTP) در کنسول سرور چاپ می‌شود.

## Production
```bash
cd panel-app && npm run build
cd ../backend && NODE_ENV=production npm start   # فرانت (dist) را هم سرو می‌کند
```
در production باید `AUTH_SECRET` و `SMS_*` و `ADMIN_PHONE` ست باشد.

## تست بک‌اند
`cd backend && npm test`

## نکات
- ورود با کد یکبارمصرف پیامکی (۵ رقم، ۲ دقیقه اعتبار، حداکثر ۵ تلاش) و توکن امضاشده.
- دسترسی هر API سمت سرور بر اساس نقش/مجوزهای پرسنل کنترل می‌شود.
- `db.json` یک فایل JSON است (نوشتن اتمیک)؛ برای ترافیک بالا بهتر است به SQLite منتقل شود.
