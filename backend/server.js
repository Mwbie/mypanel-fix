require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { sendSms, isSmsConfigured } = require('./smsService');
const auth = require('./auth');

const app = express();
if (process.env.TRUST_PROXY) {
  const tp = process.env.TRUST_PROXY;
  app.set('trust proxy', /^\d+$/.test(tp) ? Number(tp) : tp);
}

// CORS: فقط آدرس‌های مشخص‌شده (در صورت خالی بودن، فقط هم‌مبدأ)
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) =>
      !origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(null, false),
  })
);
app.use(express.json({ limit: '100kb' }));

const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'db.json');
const REFERRAL_REWARD = Number(process.env.REFERRAL_REWARD) || 200000;
const TZ = 'Asia/Tehran';

// تبدیل اعداد فارسی و عربی به انگلیسی
const toEnglishDigits = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
};

// دریافت تاریخ و ساعت فعلی برای نمایش
const getCurrentDateTime = () => {
  const now = new Date();
  return (
    now.toLocaleDateString('fa-IR', { timeZone: TZ }) +
    ' - ' +
    now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
  );
};

// دریافت تاریخ خالص شمسی با اعداد انگلیسی (مثال: 1403/08/02)
const getPersianDateKey = (dateObj = new Date()) => {
  const faDate = dateObj.toLocaleDateString('fa-IR', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return toEnglishDigits(faDate);
};

// ساخت کد معرف اختصاصی یکتا
const generateReferralCode = (phone, db) => {
  const last4 = phone.slice(-4);
  let code;
  do {
    const randomStr = Math.random().toString(36).substring(2, 4).toUpperCase();
    code = `AP-${last4}${randomStr}`;
  } while (db && db.customers.some((c) => c.referralCode === code));
  return code;
};

// حذف اطلاعات محرمانه حسابداری قبل از ارسال به پنل مشتری
const sanitizeRepairForCustomer = (repair) => {
  const {
    partCost,
    courierCost,
    receivedAmount,
    walletDeducted,
    profit,
    inventoryItemId,
    inventoryItemName,
    ...safeRepair
  } = repair;
  return safeRepair;
};

// داده‌های اولیه استاندارد ای‌پلاس
const INITIAL_DB = {
  adminPhone: process.env.ADMIN_PHONE || '',
  staff: [
    {
      id: 'ST-1',
      name: 'حسین حسینی (تعمیرکار)',
      phone: '09120000001',
      permissions: ['dashboard', 'customers', 'inventory', 'suppliers'],
    },
  ],
  customers: [
    {
      phone: '09121111111',
      name: 'رضا علوی',
      referralCode: 'AP-1111',
      walletBalance: 200000,
      referredBy: null,
    },
    {
      phone: '09122222222',
      name: 'سارا حسینی',
      referralCode: 'AP-2222',
      walletBalance: 0,
      referredBy: 'AP-1111',
    },
    {
      phone: '09123333333',
      name: 'محمد محمدی',
      referralCode: 'AP-3333',
      walletBalance: 0,
      referredBy: null,
    },
  ],
  suppliers: [
    {
      id: 'SUP-1',
      name: 'بازرگانی قطعات پارس (کریمی)',
      phone: '09125551122',
      address: 'تهران، علاءالدین، طبقه ۴، پلاک ۴۱۲',
      debt: 2500000, // مانده بدهی نسیه ما به این تأمین‌کننده
      totalPurchases: 8400000,
    },
    {
      id: 'SUP-2',
      name: 'پخش باتری و آی‌سی اورجینال (احمدی)',
      phone: '09128883344',
      address: 'تهران، پاساژ چارسو، طبقه منفی ۱، پلاک ۱۲',
      debt: 0,
      totalPurchases: 4250000,
    },
  ],
  supplierPayments: [
    {
      id: 'PAY-101',
      supplierId: 'SUP-1',
      supplierName: 'بازرگانی قطعات پارس (کریمی)',
      amount: 1500000,
      date: '1403/07/24 - 13:20',
      dateKey: '1403/07/24',
      timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
      note: 'کارت به کارت علی‌الحساب بابت فاکتور ال‌سی‌دی',
    },
  ],
  inventory: [
    {
      id: 'PRD-101',
      name: 'تاچ و ال‌سی‌دی آیفون 13 پرو (روکاری فابریک)',
      category: 'قطعات تعمیراتی',
      stock: 3,
      minStock: 1,
      buyPrice: 4200000,
      sellPrice: 5400000,
    },
    {
      id: 'PRD-102',
      name: 'باتری اورجینال آیفون 11 (تقویتی)',
      category: 'قطعات تعمیراتی',
      stock: 5,
      minStock: 2,
      buyPrice: 850000,
      sellPrice: 1450000,
    },
    {
      id: 'PRD-103',
      name: 'آی‌سی تغذیه شیائومی 12T Pro',
      category: 'قطعات تعمیراتی',
      stock: 1,
      minStock: 2,
      buyPrice: 900000,
      sellPrice: 1500000,
    },
    {
      id: 'PRD-104',
      name: 'آداپتور ۲۰ وات اورجینال اپل',
      category: 'لوازم جانبی',
      stock: 8,
      minStock: 3,
      buyPrice: 950000,
      sellPrice: 1350000,
    },
  ],
  purchases: [
    {
      id: 'PUR-1001',
      supplierId: 'SUP-1',
      supplierName: 'بازرگانی قطعات پارس (کریمی)',
      items: [
        {
          productId: 'PRD-101',
          name: 'تاچ و ال‌سی‌دی آیفون 13 پرو (روکاری فابریک)',
          qty: 2,
          buyPrice: 4200000,
          sellPrice: 5400000,
        },
      ],
      totalAmount: 8400000,
      paidAmount: 4400000,
      debtAmount: 4000000,
      paymentType: 'partial',
      date: '1403/07/22 - 11:30',
      dateKey: '1403/07/22',
      timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
      note: 'فاکتور خرید ال‌سی‌دی - بخشی نقد و مابقی نسیه',
    },
    {
      id: 'PUR-1002',
      supplierId: 'SUP-2',
      supplierName: 'پخش باتری و آی‌سی اورجینال (احمدی)',
      items: [
        {
          productId: 'PRD-102',
          name: 'باتری اورجینال آیفون 11 (تقویتی)',
          qty: 5,
          buyPrice: 850000,
          sellPrice: 1450000,
        },
      ],
      totalAmount: 4250000,
      paidAmount: 4250000,
      debtAmount: 0,
      paymentType: 'cash',
      date: '1403/07/20 - 10:15',
      dateKey: '1403/07/20',
      timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
      note: 'خرید نقدی ۵ عدد باتری',
    },
  ],
  sales: [
    {
      id: 'SAL-1001',
      customerName: 'مشتری حضوری (علی رضایی)',
      customerPhone: '09127778899',
      items: [
        {
          productId: 'PRD-104',
          name: 'آداپتور ۲۰ وات اورجینال اپل',
          qty: 1,
          buyPrice: 950000,
          sellPrice: 1350000,
        },
      ],
      totalAmount: 1350000,
      totalCost: 950000,
      profit: 400000,
      date: getCurrentDateTime(),
      dateKey: getPersianDateKey(new Date()),
      timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
      note: 'فروش نقدی حضوری',
    },
  ],
  repairs: [
    {
      id: 'AP-1005',
      name: 'رضا علوی',
      phone: '09121111111',
      device: 'آیفون 13 پرو',
      issue: 'شکستگی گلس و تاچ السیدی',
      status: 'ready',
      technicalIssue: 'تعویض گلس روی فلت فابریک',
      estimatedReadyTime: 'امروز ساعت ۱۸:۰۰',
      estimatedCost: 3500000,
      previousEstimatedCost: 0,
      costApproved: 'approved',
      serviceDescription: 'تعویض گلس فابریک با دستگاه لمینت',
      warrantyMonths: 0,
      deliveryTimestamp: null,
      deliveryDateKey: null,
      partCost: 0,
      courierCost: 0,
      receivedAmount: 0,
      walletDeducted: 0,
      profit: 0,
      inventoryItemId: null,
      inventoryItemName: null,
      satisfaction: null,
      feedback: '',
      receptionDate: '1403/07/25 - 16:30',
      readyDate: '1403/07/26 - 10:00',
      deliveryDate: null,
      referralRewardPaid: false,
    },
    {
      id: 'AP-1004',
      name: 'سارا حسینی',
      phone: '09122222222',
      device: 'سامسونگ S22 Ultra',
      issue: 'تخلیه سریع باتری و داغ شدن برد',
      status: 'in_progress',
      technicalIssue: 'جریان‌کشی مدار تغذیه و نیاز به تعویض آی‌سی شارژ',
      estimatedReadyTime: 'فردا ظهر',
      estimatedCost: 2200000,
      previousEstimatedCost: 0,
      costApproved: 'pending',
      serviceDescription: '',
      warrantyMonths: 0,
      deliveryTimestamp: null,
      deliveryDateKey: null,
      partCost: 0,
      courierCost: 0,
      receivedAmount: 0,
      walletDeducted: 0,
      profit: 0,
      inventoryItemId: null,
      inventoryItemName: null,
      satisfaction: null,
      feedback: '',
      receptionDate: '1403/07/25 - 14:15',
      readyDate: null,
      deliveryDate: null,
      referralRewardPaid: false,
    },
    {
      id: 'AP-1003',
      name: 'محمد محمدی',
      phone: '09123333333',
      device: 'شیائومی 12T Pro',
      issue: 'خاموشی ناگهانی - مشکل آی‌سی تغذیه',
      status: 'delivered',
      technicalIssue: 'سوختگی آی‌سی تغذیه اصلی',
      estimatedReadyTime: 'تحویل شده',
      estimatedCost: 2800000,
      previousEstimatedCost: 0,
      costApproved: 'approved',
      serviceDescription: 'تعویض آی‌سی تغذیه و ریبال مدار',
      warrantyMonths: 3,
      deliveryTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      deliveryDateKey: getPersianDateKey(new Date()),
      partCost: 900000,
      courierCost: 100000,
      receivedAmount: 2800000,
      walletDeducted: 0,
      profit: 1800000,
      inventoryItemId: 'PRD-103',
      inventoryItemName: 'آی‌سی تغذیه شیائومی 12T Pro',
      satisfaction: 5,
      feedback: 'بسیار عالی و سریع انجام شد',
      receptionDate: '1403/07/20 - 11:00',
      readyDate: '1403/07/21 - 12:30',
      deliveryDate: '1403/07/21 - 18:00',
      referralRewardPaid: false,
    },
    {
      id: 'AP-1002',
      name: 'رضا علوی',
      phone: '09121111111',
      device: 'آیفون 11',
      issue: 'تعویض باتری اورجینال',
      status: 'delivered',
      technicalIssue: 'افت سلامت باتری به زیر ۷۰ درصد',
      estimatedReadyTime: 'تحویل شده',
      estimatedCost: 1900000,
      previousEstimatedCost: 0,
      costApproved: 'approved',
      serviceDescription: 'تعویض باتری تقویتی اورجینال بدون ارور',
      warrantyMonths: 6,
      deliveryTimestamp: Date.now() - 40 * 24 * 60 * 60 * 1000,
      deliveryDateKey: '1403/06/11',
      partCost: 850000,
      courierCost: 50000,
      receivedAmount: 1900000,
      walletDeducted: 0,
      profit: 1000000,
      inventoryItemId: 'PRD-102',
      inventoryItemName: 'باتری اورجینال آیفون 11 (تقویتی)',
      satisfaction: 4,
      feedback: '',
      receptionDate: '1403/06/10 - 18:45',
      readyDate: '1403/06/11 - 10:00',
      deliveryDate: '1403/06/11 - 12:00',
      referralRewardPaid: false,
    },
  ],
};

// در production دیتابیس خالی ساخته می‌شود تا داده‌های نمونه وارد سیستم واقعی نشوند
const EMPTY_DB = {
  adminPhone: process.env.ADMIN_PHONE || '',
  staff: [],
  customers: [],
  suppliers: [],
  supplierPayments: [],
  inventory: [],
  purchases: [],
  sales: [],
  repairs: [],
};

const IS_PROD = process.env.NODE_ENV === 'production';

const readDB = () => {
  const baseTemplate = IS_PROD ? EMPTY_DB : INITIAL_DB;
  if (!fs.existsSync(DB_FILE)) {
    const fresh = JSON.parse(JSON.stringify(baseTemplate)); // کپی عمیق تا ثابت اصلی دست نخورد
    if (process.env.ADMIN_PHONE) fresh.adminPhone = process.env.ADMIN_PHONE;
    writeDB(fresh);
    return fresh;
  }
  const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  const defaults = JSON.parse(JSON.stringify(baseTemplate));
  for (const key of ['customers', 'staff', 'suppliers', 'supplierPayments', 'inventory', 'purchases', 'sales', 'repairs']) {
    if (!data[key]) data[key] = defaults[key];
  }
  if (process.env.ADMIN_PHONE) data.adminPhone = process.env.ADMIN_PHONE;
  return data;
};

// نوشتن اتمیک: اول فایل موقت، بعد rename؛ تا در صورت کرش فایل اصلی نیمه‌نوشته نماند
const writeDB = (data) => {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, DB_FILE);
};

// ==========================================
// احراز هویت و کنترل دسترسی
// ==========================================

const ALL_PERMISSIONS = [
  'dashboard',
  'customers',
  'inventory',
  'suppliers',
  'accounting',
  'sms',
  'settings',
];
const REPAIR_STATUSES = ['received', 'in_progress', 'ready', 'delivered', 'unrepairable'];

const isValidPhone = (p) => /^09\d{9}$/.test(p);
const oneLine = (v, max = 100) =>
  String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
// عدد نامنفی یا null در صورت نامعتبر بودن
const nonNegative = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

// مبلغ توافق‌شده با مشتری: اگر agreedCost ثبت شده برگردان، وگرنه از estimatedCost قدیمی استفاده کن
const getAgreedCost = (r) => {
  if (Number(r.agreedCost) > 0) return Number(r.agreedCost);
  return r.costApproved === 'approved' ? Number(r.estimatedCost) || 0 : 0;
};

// کاربر لاگین‌شده را از توکن + وضعیت فعلی دیتابیس می‌سازد
// (با حذف پرسنل یا تغییر دسترسی‌ها، اثر بلافاصله اعمال می‌شود)
const getUserFromRequest = (req) => {
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/);
  if (!m) return null;
  const payload = auth.verify(m[1]);
  if (!payload) return null;
  const db = readDB();

  if (payload.role === 'admin') {
    if (!db.adminPhone || payload.sub !== db.adminPhone) return null;
    return { role: 'admin', phone: payload.sub, name: 'مدیر کل سیستم', permissions: ALL_PERMISSIONS };
  }
  if (payload.role === 'staff') {
    const s = (db.staff || []).find((x) => x.phone === payload.sub);
    if (!s) return null;
    return { role: 'staff', phone: s.phone, name: s.name, permissions: s.permissions || ['dashboard'] };
  }
  if (payload.role === 'customer') {
    return { role: 'customer', phone: payload.sub, permissions: [] };
  }
  return null;
};

// فقط پرسنل/مدیر؛ اگر perms داده شود حداقل یکی از آن‌ها لازم است
const requireAuth =
  (...perms) =>
  (req, res, next) => {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'ابتدا وارد شوید.' });
    if (user.role === 'customer') {
      return res.status(403).json({ error: 'دسترسی مجاز نیست.' });
    }
    if (
      perms.length > 0 &&
      user.role !== 'admin' &&
      !perms.some((p) => user.permissions.includes(p))
    ) {
      return res.status(403).json({ error: 'شما به این بخش دسترسی ندارید.' });
    }
    req.user = user;
    next();
  };

const requireAdmin = (req, res, next) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'ابتدا وارد شوید.' });
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'فقط مدیر کل به این بخش دسترسی دارد.' });
  }
  req.user = user;
  next();
};

// هر کاربر لاگین‌شده (مشتری هم)؛ کنترل مالکیت داخل خود روت انجام می‌شود
const requireAnyUser = (req, res, next) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'ابتدا وارد شوید.' });
  req.user = user;
  next();
};

// آیا کاربر به اطلاعات این شماره مشتری دسترسی دارد؟
const canAccessCustomer = (user, phone) => {
  if (user.role === 'customer') return user.phone === phone;
  return (
    user.role === 'admin' ||
    user.permissions.includes('dashboard') ||
    user.permissions.includes('customers')
  );
};

const resolveIdentity = (db, phone, isAdminMode) => {
  if (isAdminMode) {
    if (db.adminPhone && phone === db.adminPhone) return { role: 'admin' };
    const s = (db.staff || []).find((x) => x.phone === phone);
    return s ? { role: 'staff', staff: s } : null;
  }
  const known =
    db.customers.some((c) => c.phone === phone) ||
    db.repairs.some((r) => r.phone === phone);
  return known ? { role: 'customer' } : null;
};

const buildCustomerProfile = (db, phone) => {
  const repairs = db.repairs.filter((r) => r.phone === phone).map(sanitizeRepairForCustomer);
  const customer = db.customers.find((c) => c.phone === phone);
  if (!customer && repairs.length === 0) return null;
  return {
    name: customer ? customer.name : repairs[0].name,
    phone,
    referralCode: customer ? customer.referralCode : '',
    walletBalance: customer ? customer.walletBalance || 0 : 0,
    repairs,
  };
};

const otpRequestLimiter = auth.rateLimit({ windowMs: 10 * 60 * 1000, max: 15 });
const otpVerifyLimiter = auth.rateLimit({ windowMs: 10 * 60 * 1000, max: 40 });

// مرحله ۱: درخواست کد یکبارمصرف
app.post('/api/auth/request-otp', otpRequestLimiter, async (req, res) => {
  const phone = toEnglishDigits(req.body.phone || '').trim();
  const isAdminMode = req.body.isAdminMode === true;
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'لطفاً یک شماره موبایل معتبر (مثل 0912...) وارد کنید.' });
  }

  const db = readDB();
  const identity = resolveIdentity(db, phone, isAdminMode);

  if (!identity) {
    // برای ورود مدیریتی وجود/عدم وجود شماره را فاش نمی‌کنیم
    if (isAdminMode) return res.json({ ok: true });
    return res.status(404).json({ error: 'شماره شما در سیستم ای‌پلاس ثبت نشده است.' });
  }

  const key = `${isAdminMode ? 'admin' : 'customer'}:${phone}`;
  const otp = auth.createOtp(key);
  if (otp.error) return res.status(429).json({ error: otp.error });

  const text = `کد ورود شما به ای‌پلاس: ${otp.code}\nاین کد را به کسی ندهید.`;

  if (!isSmsConfigured()) {
    if (auth.IS_PROD) {
      console.error('[auth] سرویس پیامک تنظیم نشده و نمی‌توان کد ورود فرستاد.');
      return isAdminMode
        ? res.json({ ok: true })
        : res.status(503).json({ error: 'ارسال پیامک در حال حاضر ممکن نیست.' });
    }
    console.log(`[DEV] کد ورود ${phone}: ${otp.code}`);
    return res.json({ ok: true });
  }

  const result = await sendSms(phone, text);
  if (!result.success && !isAdminMode) {
    return res.status(502).json({ error: 'ارسال پیامک ناموفق بود؛ کمی بعد دوباره تلاش کنید.' });
  }
  res.json({ ok: true });
});

// مرحله ۲: تایید کد و دریافت توکن
app.post('/api/auth/verify-otp', otpVerifyLimiter, (req, res) => {
  const phone = toEnglishDigits(req.body.phone || '').trim();
  const code = toEnglishDigits(req.body.code || '').trim();
  const isAdminMode = req.body.isAdminMode === true;

  const db = readDB();
  const identity = isValidPhone(phone) ? resolveIdentity(db, phone, isAdminMode) : null;
  const key = `${isAdminMode ? 'admin' : 'customer'}:${phone}`;
  const check = identity ? auth.checkOtp(key, code) : { ok: false, error: 'کد وارد شده اشتباه است.' };
  if (!check.ok) return res.status(401).json({ error: check.error });

  if (identity.role === 'admin') {
    return res.json({
      token: auth.sign({ sub: phone, role: 'admin' }, 12 * 3600),
      role: 'admin',
      name: 'مدیر کل سیستم',
      permissions: ALL_PERMISSIONS,
    });
  }
  if (identity.role === 'staff') {
    return res.json({
      token: auth.sign({ sub: phone, role: 'staff' }, 12 * 3600),
      role: 'staff',
      name: identity.staff.name,
      permissions: identity.staff.permissions || ['dashboard'],
    });
  }

  let customer = db.customers.find((c) => c.phone === phone);
  if (!customer) {
    const firstRepair = db.repairs.find((r) => r.phone === phone);
    customer = {
      phone,
      name: firstRepair ? firstRepair.name : 'مشتری',
      referralCode: generateReferralCode(phone, db),
      walletBalance: 0,
      referredBy: null,
    };
    db.customers.push(customer);
    writeDB(db);
  }
  res.json({
    token: auth.sign({ sub: phone, role: 'customer' }, 7 * 24 * 3600),
    role: 'customer',
    customerData: buildCustomerProfile(db, phone),
  });
});

// ==========================================
// بخش ۱: مدیریت تعمیرات و مشتریان
// ==========================================

// بازگرداندن اثرات «تحویل» وقتی وضعیت از delivered به چیز دیگری برمی‌گردد
const revertDelivery = (db, repair) => {
  if (repair.inventoryItemId) {
    const item = db.inventory.find((i) => i.id === repair.inventoryItemId);
    if (item) item.stock = (Number(item.stock) || 0) + 1;
    repair.inventoryItemId = null;
    repair.inventoryItemName = null;
  }
  const customer = db.customers.find((c) => c.phone === repair.phone);
  if (customer && repair.walletDeducted > 0) {
    customer.walletBalance = (Number(customer.walletBalance) || 0) + repair.walletDeducted;
  }
  repair.walletDeducted = 0;

  if (repair.referralRewardPaid && customer && customer.referredBy) {
    const referrer = db.customers.find(
      (c) => c.referralCode === customer.referredBy && c.phone !== customer.phone
    );
    if (referrer) {
      referrer.walletBalance = Math.max(0, (Number(referrer.walletBalance) || 0) - REFERRAL_REWARD);
    }
  }
  repair.referralRewardPaid = false;
  repair.receivedAmount = 0;
  repair.profit = 0;
  repair.deliveryDate = null;
  repair.deliveryDateKey = null;
  repair.deliveryTimestamp = null;
};

app.get('/api/repairs', requireAuth('dashboard'), (req, res) => {
  const db = readDB();
  const enrichedRepairs = db.repairs.map((r) => {
    const customer = db.customers.find((c) => c.phone === r.phone);
    let dateKey = r.deliveryDateKey;
    if (!dateKey && r.deliveryDate) {
      dateKey = toEnglishDigits(r.deliveryDate.split(' - ')[0].trim());
    }
    return {
      ...r,
      deliveryDateKey: dateKey || null,
      walletBalance: customer ? customer.walletBalance : 0,
      referralCode: customer ? customer.referralCode : '',
    };
  });
  res.json(enrichedRepairs);
});

app.get('/api/customers', requireAuth('dashboard', 'customers'), (req, res) => {
  const db = readDB();
  const enrichedCustomers = db.customers.map((c) => {
    const customerRepairs = db.repairs.filter((r) => r.phone === c.phone);
    const ratedRepairs = customerRepairs.filter((r) => r.satisfaction);
    const avgSatisfaction =
      ratedRepairs.length > 0
        ? (
            ratedRepairs.reduce((sum, r) => sum + Number(r.satisfaction), 0) /
            ratedRepairs.length
          ).toFixed(1)
        : null;

    return { ...c, totalRepairs: customerRepairs.length, avgSatisfaction };
  });
  res.json(enrichedCustomers);
});

// ثبت پذیرش دستگاه جدید + ارسال پیامک کد پیگیری
app.post('/api/repairs', requireAuth('dashboard'), (req, res) => {
  const name = oneLine(req.body.name, 80);
  const device = oneLine(req.body.device, 80);
  const issue = oneLine(req.body.issue, 500);
  const cleanPhone = toEnglishDigits(req.body.phone || '').trim();
  const referredByCode = oneLine(req.body.referredByCode, 20).toUpperCase();
  const agreedCostRaw = nonNegative(req.body.agreedCost);
  const agreedCost = agreedCostRaw !== null ? agreedCostRaw : 0;

  if (!name || !cleanPhone || !device || !issue) {
    return res.status(400).json({ error: 'لطفاً تمام فیلدهای الزامی را پر کنید' });
  }
  if (!isValidPhone(cleanPhone)) {
    return res.status(400).json({ error: 'شماره موبایل معتبر نیست' });
  }

  const db = readDB();
  const isFirstRepair = !db.repairs.some((r) => r.phone === cleanPhone);

  // کد معرف فقط وقتی معتبر است که وجود داشته باشد و مال خود مشتری نباشد
  const referrer = referredByCode
    ? db.customers.find((c) => c.referralCode === referredByCode && c.phone !== cleanPhone)
    : null;

  let customer = db.customers.find((c) => c.phone === cleanPhone);
  if (!customer) {
    customer = {
      phone: cleanPhone,
      name,
      referralCode: generateReferralCode(cleanPhone, db),
      walletBalance: 0,
      referredBy: referrer ? referrer.referralCode : null,
    };
    db.customers.push(customer);
  } else {
    customer.name = name;
    if (referrer && !customer.referredBy && isFirstRepair) {
      customer.referredBy = referrer.referralCode;
    }
  }

  // کد پیگیری یکتا (مثلاً AP-4829)
  let newId;
  do {
    newId = 'AP-' + Math.floor(1000 + Math.random() * 9000);
  } while (db.repairs.some((r) => r.id === newId));

  const newRepairItem = {
    id: newId,
    name,
    phone: cleanPhone,
    device,
    issue,
    status: 'received',
    receptionDate: getCurrentDateTime(),
    technicalIssue: '',
    estimatedCost: agreedCost,
    agreedCost,
    previousEstimatedCost: 0,
    estimatedReadyTime: '',
    costApproved: agreedCost > 0 ? 'approved' : 'pending',
    serviceDescription: '',
    warrantyMonths: 0,
    partCost: 0,
    courierCost: 0,
    receivedAmount: 0,
    walletDeducted: 0,
    profit: 0,
    inventoryItemId: null,
    inventoryItemName: null,
    readyDate: null,
    deliveryDate: null,
    deliveryDateKey: null,
    deliveryTimestamp: null,
    satisfaction: null,
    feedback: '',
    referralRewardPaid: false,
  };

  db.repairs.unshift(newRepairItem);
  writeDB(db);

  // ارسال پیامک بعد از ذخیره و بدون انتظار (تا پاسخ معطل پنل پیامک نشود)
  sendSms(
    cleanPhone,
    `مشتری گرامی ${name}، دستگاه شما (${device}) با کد پیگیری ${newId} در تعمیرات تخصصی ای‌پلاس پذیرش شد.`
  );

  res.status(201).json(newRepairItem);
});

// تغییر وضعیت دستگاه + پیامک‌های «اعلام هزینه» و «آماده تحویل»
app.put('/api/repairs/:id/status', requireAuth('dashboard'), (req, res) => {
  const { id } = req.params;
  const {
    status,
    technicalIssue,
    estimatedCost,
    estimatedReadyTime,
    serviceDescription,
    warrantyMonths,
    partCost,
    courierCost,
    receivedAmount,
    useWallet,
    inventoryItemId,
  } = req.body;

  if (!REPAIR_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'وضعیت نامعتبر است' });
  }
  // همه‌ی مبالغ ارسالی (در صورت وجود) باید عدد نامنفی باشند
  for (const v of [estimatedCost, warrantyMonths, partCost, courierCost, receivedAmount]) {
    if (v !== undefined && v !== '' && v !== null && nonNegative(v) === null) {
      return res.status(400).json({ error: 'مبالغ باید عدد و غیرمنفی باشند' });
    }
  }

  const db = readDB();
  const repair = db.repairs.find((r) => r.id === id);
  if (!repair) {
    return res.status(404).json({ error: 'دستگاه یافت نشد' });
  }

  const prevStatus = repair.status;
  const warnings = [];
  const smsQueue = [];
  const customer = db.customers.find((c) => c.phone === repair.phone);

  // خروج از وضعیت‌های «بسته» → برگرداندن اثرات قبلی
  if (prevStatus === 'delivered' && status !== 'delivered') revertDelivery(db, repair);
  if (prevStatus === 'unrepairable' && status !== 'unrepairable') {
    repair.deliveryDate = null;
    repair.deliveryDateKey = null;
    repair.deliveryTimestamp = null;
  }

  repair.status = status;

  // حالت ۱: در حال تعمیر (اعلام هزینه و زمان به مشتری برای تایید)
    // حالت ۱: در حال تعمیر
  // اگر هزینه با مبلغ توافق‌شده یکی باشد نیازی به تایید مشتری نیست؛
  // فقط وقتی مبلغ کم یا زیاد شود، از مشتری تایید مجدد گرفته می‌شود.
  if (status === 'in_progress') {
    const newCost = Number(estimatedCost) || 0;
    const agreed = getAgreedCost(repair);

    repair.technicalIssue = oneLine(technicalIssue, 500) || repair.technicalIssue;
    repair.estimatedReadyTime = oneLine(estimatedReadyTime, 100);
    repair.estimatedCost = newCost;
    repair.agreedCost = agreed;

    const timeLine = `زمان حدودی: ${repair.estimatedReadyTime || 'متعاقباً اعلام می‌شود'}`;

    if (agreed > 0 && newCost === agreed) {
      repair.previousEstimatedCost = 0;
      repair.costApproved = 'approved';
      smsQueue.push([
        repair.phone,
        `مشتری گرامی، دستگاه (${repair.device}) بررسی شد و تعمیر آن شروع شد.\nایراد فنی: ${repair.technicalIssue}\nهزینه طبق توافق: ${fmt(newCost)} تومان\n${timeLine}`,
      ]);
    } else {
      repair.previousEstimatedCost = agreed; // صفر یعنی قبلاً مبلغی توافق نشده بود
      repair.costApproved = 'pending'; // منتظر تایید مشتری
      const changeLine =
        agreed > 0
          ? `هزینه از ${fmt(agreed)} به ${fmt(newCost)} تومان تغییر کرد.`
          : `هزینه برآوردشده: ${fmt(newCost)} تومان`;
      smsQueue.push([
        repair.phone,
        `مشتری گرامی، دستگاه (${repair.device}) بررسی شد.\nایراد فنی: ${repair.technicalIssue}\n${changeLine}\n${timeLine}\nلطفاً جهت تایید هزینه وارد پنل کاربری خود در ای‌پلاس شوید.`,
      ]);
    }
  }

  // حالت ۲: آماده تحویل
  if (status === 'ready') {
    repair.readyDate = getCurrentDateTime();
    smsQueue.push([
      repair.phone,
      `مشتری گرامی ${repair.name}، دستگاه شما (${repair.device}) با کد ${repair.id} آماده تحویل می‌باشد. لطفاً جهت دریافت به فروشگاه ای‌پلاس مراجعه فرمایید.`,
    ]);
  }

  // حالت ۳: غیرقابل تعمیر
  if (status === 'unrepairable') {
    repair.technicalIssue = oneLine(technicalIssue, 500) || 'غیرقابل تعمیر';
    if (!repair.deliveryTimestamp) {
      repair.deliveryDate = getCurrentDateTime();
      repair.deliveryDateKey = getPersianDateKey();
      repair.deliveryTimestamp = Date.now();
    }
  }

  // حالت ۴: تحویل به مشتری و تسویه حساب
  if (status === 'delivered') {
    const firstDelivery = prevStatus !== 'delivered';

    repair.serviceDescription = oneLine(serviceDescription, 500) || repair.technicalIssue;
    repair.warrantyMonths = Number(warrantyMonths) || 0;
    repair.partCost = Number(partCost) || 0;
    repair.courierCost = Number(courierCost) || 0;
    repair.receivedAmount = Number(receivedAmount) || 0;

    // تاریخ تحویل فقط بار اول ثبت می‌شود (ویرایش بعدی درآمد را بین روزها جابه‌جا نکند)
    if (firstDelivery || !repair.deliveryTimestamp) {
      repair.deliveryDate = getCurrentDateTime();
      repair.deliveryDateKey = getPersianDateKey();
      repair.deliveryTimestamp = Date.now();
    }

    // کسر قطعه از انبار (در صورت تغییر قطعه، قطعه‌ی قبلی به انبار برمی‌گردد)
    if (inventoryItemId && repair.inventoryItemId !== inventoryItemId) {
      const invItem = db.inventory.find((i) => i.id === inventoryItemId);
      if (!invItem) {
        warnings.push('قطعه‌ی انتخابی در انبار یافت نشد و کسر نشد.');
      } else if (!(invItem.stock > 0)) {
        warnings.push(`موجودی «${invItem.name}» صفر است؛ از انبار کسر نشد.`);
      } else {
        if (repair.inventoryItemId) {
          const oldItem = db.inventory.find((i) => i.id === repair.inventoryItemId);
          if (oldItem) oldItem.stock = (Number(oldItem.stock) || 0) + 1;
        }
        invItem.stock -= 1;
        repair.inventoryItemId = inventoryItemId;
        repair.inventoryItemName = invItem.name;
      }
    }

    // کسر از کیف پول (فقط بار اول و حداکثر به اندازه‌ی کل هزینه‌ی تعمیر)
    if (firstDelivery && useWallet && customer && customer.walletBalance > 0) {
      const balance = Number(customer.walletBalance) || 0;
      const totalPrice =
        repair.estimatedCost > 0 ? repair.estimatedCost : repair.receivedAmount + balance;
      const deduct = Math.min(balance, totalPrice);
      if (deduct > 0) {
        repair.walletDeducted = deduct;
        customer.walletBalance = balance - deduct;
      }
    }

    // سود خالص (نقدی): مبلغ دریافتی - هزینه قطعه - هزینه پیک
    repair.profit = repair.receivedAmount - repair.partCost - repair.courierCost;

    // هدیه‌ی معرف: یک‌بار، با اولین تحویل موفق مشتریِ معرفی‌شده
    if (
      firstDelivery &&
      customer &&
      customer.referredBy &&
      repair.receivedAmount + repair.walletDeducted > 0 &&
      !db.repairs.some((r) => r.phone === repair.phone && r.referralRewardPaid)
    ) {
      const referrer = db.customers.find(
        (c) => c.referralCode === customer.referredBy && c.phone !== customer.phone
      );
      if (referrer) {
        referrer.walletBalance = (Number(referrer.walletBalance) || 0) + REFERRAL_REWARD;
        repair.referralRewardPaid = true;
        smsQueue.push([
          referrer.phone,
          `ای‌پلاس: به‌خاطر معرفی دوستتان، ${fmt(REFERRAL_REWARD)} تومان به کیف پول شما اضافه شد.`,
        ]);
      }
    }
  }

  // اول ذخیره، بعد پیامک (تا هم‌زمانی درخواست‌ها داده را بازنویسی نکند)
  writeDB(db);
  smsQueue.forEach(([phone, text]) => sendSms(phone, text));

  res.json({ success: true, repair, warnings });
});

// مشتری (صاحب دستگاه) یا پرسنل
app.post('/api/repairs/:id/approve-cost', requireAnyUser, (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;
  if (typeof approved !== 'boolean') {
    return res.status(400).json({ error: 'مقدار approved نامعتبر است' });
  }

  const db = readDB();
  const repair = db.repairs.find((r) => r.id === id);
  if (!repair || !canAccessCustomer(req.user, repair.phone)) {
    return res.status(404).json({ error: 'دستگاه یافت نشد' });
  }
  if (repair.status !== 'in_progress') {
    return res.status(409).json({ error: 'در این وضعیت امکان تایید/رد هزینه وجود ندارد' });
  }

  repair.costApproved = approved ? 'approved' : 'rejected';
  writeDB(db);
  if (approved) repair.agreedCost = Number(repair.estimatedCost) || 0; // مبنای توافق‌های بعدی
  res.json(sanitizeRepairForCustomer(repair));
});

app.delete('/api/repairs/:id', requireAuth('dashboard'), (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const repair = db.repairs.find((r) => r.id === id);
  if (!repair) {
    return res.status(404).json({ error: 'رکورد مورد نظر یافت نشد' });
  }
  // اگر تحویل‌شده بود، موجودی انبار و کیف پول را قبل از حذف برگردان
  if (repair.status === 'delivered') revertDelivery(db, repair);

  db.repairs = db.repairs.filter((r) => r.id !== id);
  writeDB(db);
  res.json({ message: 'رکورد با موفقیت حذف شد' });
});

app.post(
  '/api/customers/:phone/wallet/deduct',
  requireAuth('dashboard', 'customers'),
  (req, res) => {
    const phone = toEnglishDigits(req.params.phone).trim();
    const { amount } = req.body;

    const db = readDB();
    const customer = db.customers.find((c) => c.phone === phone);
    if (!customer) {
      return res.status(404).json({ error: 'مشتری یافت نشد' });
    }

    const deductAmount =
      amount !== undefined ? nonNegative(amount) : Number(customer.walletBalance) || 0;
    if (deductAmount === null) {
      return res.status(400).json({ error: 'مبلغ نامعتبر است' });
    }
    customer.walletBalance = Math.max(0, (customer.walletBalance || 0) - deductAmount);

    writeDB(db);
    res.json(customer);
  }
);

// ==========================================
// بخش ۲: انبار، کالا و کاردکس گردش کالا
// ==========================================

app.get('/api/inventory', requireAuth(), (req, res) => {
  const db = readDB();
  res.json(db.inventory || []);
});

// کاردکس کامل یک کالا (خرید از تأمین‌کننده + فروش مستقیم + مصرف در تعمیرات)
app.get('/api/inventory/:id/cardex', requireAuth('inventory'), (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const product = (db.inventory || []).find((i) => i.id === id);

  if (!product) {
    return res.status(404).json({ error: 'کالا در انبار یافت نشد' });
  }

  const history = [];

  (db.purchases || []).forEach((pur) => {
    (pur.items || []).forEach((it) => {
      if (it.productId === id) {
        history.push({
          id: `${pur.id}-${id}`,
          refId: pur.id,
          type: 'in',
          typeLabel: 'خرید از تأمین‌کننده',
          qty: Number(it.qty) || 1,
          unitPrice: Number(it.buyPrice) || 0,
          totalPrice: (Number(it.qty) || 1) * (Number(it.buyPrice) || 0),
          actorName: pur.supplierName || 'تأمین‌کننده',
          date: pur.date,
          timestamp: pur.timestamp || 0,
          note: pur.note || `فاکتور خرید ${pur.id}`,
        });
      }
    });
  });

  (db.sales || []).forEach((sal) => {
    (sal.items || []).forEach((it) => {
      if (it.productId === id) {
        history.push({
          id: `${sal.id}-${id}`,
          refId: sal.id,
          type: 'out_sale',
          typeLabel: 'فروش مستقیم کالا',
          qty: Number(it.qty) || 1,
          unitPrice: Number(it.sellPrice) || 0,
          totalPrice: (Number(it.qty) || 1) * (Number(it.sellPrice) || 0),
          actorName: sal.customerName || 'مشتری حضوری',
          date: sal.date,
          timestamp: sal.timestamp || 0,
          note: sal.note || `فاکتور فروش ${sal.id}`,
        });
      }
    });
  });

  (db.repairs || []).forEach((rep) => {
    if (rep.inventoryItemId === id && rep.status === 'delivered') {
      history.push({
        id: `${rep.id}-${id}`,
        refId: rep.id,
        type: 'out_repair',
        typeLabel: 'مصرف در تعمیرات',
        qty: 1,
        unitPrice: Number(rep.partCost) || product.buyPrice || 0,
        totalPrice: Number(rep.receivedAmount) || 0,
        actorName: `${rep.name} (${rep.device})`,
        date: rep.deliveryDate || rep.receptionDate,
        timestamp: rep.deliveryTimestamp || 0,
        note: rep.serviceDescription || rep.technicalIssue || `پذیرش کد ${rep.id}`,
      });
    }
  });

  history.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  res.json({ product, history });
});

app.post('/api/inventory', requireAuth('inventory'), (req, res) => {
  const { id, name, category, stock, minStock, buyPrice, sellPrice } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'نام کالا یا قطعه الزامی است' });
  }
  const values = {
    stock: nonNegative(stock === '' || stock === undefined ? 0 : stock),
    minStock: nonNegative(minStock === '' || minStock === undefined ? 1 : minStock),
    buyPrice: nonNegative(buyPrice === '' || buyPrice === undefined ? 0 : buyPrice),
    sellPrice: nonNegative(sellPrice === '' || sellPrice === undefined ? 0 : sellPrice),
  };
  if (Object.values(values).some((v) => v === null)) {
    return res.status(400).json({ error: 'موجودی و قیمت‌ها باید عدد غیرمنفی باشند' });
  }

  const db = readDB();
  let item = id ? db.inventory.find((i) => i.id === id) : null;

  if (item) {
    item.name = oneLine(name, 120);
    item.category = category || 'قطعات تعمیراتی';
    Object.assign(item, values);
  } else {
    const nums = db.inventory
      .map((i) => parseInt(i.id.replace('PRD-', ''), 10))
      .filter((n) => !isNaN(n));
    const maxId = nums.length > 0 ? Math.max(...nums) : 100;

    item = {
      id: `PRD-${maxId + 1}`,
      name: oneLine(name, 120),
      category: category || 'قطعات تعمیراتی',
      ...values,
    };
    db.inventory.unshift(item);
  }

  writeDB(db);
  res.json(item);
});

app.delete('/api/inventory/:id', requireAuth('inventory'), (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.inventory = db.inventory.filter((i) => i.id !== id);
  writeDB(db);
  res.json({ message: 'کالا از انبار حذف شد' });
});

// ==========================================
// بخش ۳: تأمین‌کنندگان قطعات و کاردکس مالی طرف‌حساب
// ==========================================

app.get('/api/suppliers', requireAuth('suppliers', 'inventory', 'accounting'), (req, res) => {
  const db = readDB();
  res.json({
    suppliers: db.suppliers || [],
    payments: db.supplierPayments || [],
  });
});

app.get('/api/suppliers/:id/cardex', requireAuth('suppliers'), (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const supplier = (db.suppliers || []).find((s) => s.id === id);

  if (!supplier) {
    return res.status(404).json({ error: 'تأمین‌کننده یافت نشد' });
  }

  const supplierPurchases = (db.purchases || [])
    .filter((p) => p.supplierId === id)
    .map((p) => ({
      id: p.id,
      type: 'purchase',
      date: p.date,
      timestamp: p.timestamp || 0,
      items: p.items || [],
      totalAmount: Number(p.totalAmount) || 0,
      paidAmount: Number(p.paidAmount) || 0,
      debtAmount: Number(p.debtAmount) || 0,
      paymentType: p.paymentType,
      note: p.note || '',
    }));

  const payments = (db.supplierPayments || [])
    .filter((pay) => pay.supplierId === id)
    .map((pay) => ({
      id: pay.id,
      type: 'payment',
      date: pay.date,
      timestamp: pay.timestamp || 0,
      amount: Number(pay.amount) || 0,
      note: pay.note || 'پرداخت وجه / تسویه حساب',
    }));

  const transactions = [...supplierPurchases, ...payments].sort(
    (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
  );

  res.json({ supplier, purchases: supplierPurchases, payments, transactions });
});

app.post('/api/suppliers', requireAuth('suppliers'), (req, res) => {
  const { id, name, phone, address, initialDebt } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'نام تأمین‌کننده الزامی است' });
  }
  const hasDebt = initialDebt !== undefined && initialDebt !== '';
  if (hasDebt && nonNegative(initialDebt) === null) {
    return res.status(400).json({ error: 'بدهی اولیه باید عدد غیرمنفی باشد' });
  }

  const db = readDB();
  let supplier = id ? db.suppliers.find((s) => s.id === id) : null;

  if (supplier) {
    supplier.name = oneLine(name, 120);
    supplier.phone = toEnglishDigits(phone || '').trim();
    supplier.address = oneLine(address, 300);
    if (hasDebt) supplier.debt = Number(initialDebt) || 0;
  } else {
    const nums = db.suppliers
      .map((s) => parseInt(s.id.replace('SUP-', ''), 10))
      .filter((n) => !isNaN(n));
    const maxId = nums.length > 0 ? Math.max(...nums) : 0;

    supplier = {
      id: `SUP-${maxId + 1}`,
      name: oneLine(name, 120),
      phone: toEnglishDigits(phone || '').trim(),
      address: oneLine(address, 300),
      debt: Number(initialDebt) || 0,
      totalPurchases: 0,
    };
    db.suppliers.unshift(supplier);
  }

  writeDB(db);
  res.json(supplier);
});

// ثبت پرداخت بدهی (کامل یا علی‌الحساب). مبلغ بیشتر از بدهی به اندازه‌ی بدهی محدود می‌شود
app.post('/api/suppliers/:id/pay', requireAuth('suppliers'), (req, res) => {
  const { id } = req.params;
  const { amount, note } = req.body;
  const requested = nonNegative(amount) || 0;

  if (requested <= 0) {
    return res.status(400).json({ error: 'مبلغ پرداختی باید بیشتر از صفر باشد' });
  }

  const db = readDB();
  const supplier = db.suppliers.find((s) => s.id === id);
  if (!supplier) {
    return res.status(404).json({ error: 'تأمین‌کننده یافت نشد' });
  }

  const previousDebt = Number(supplier.debt) || 0;
  if (previousDebt <= 0) {
    return res.status(409).json({ error: 'این تأمین‌کننده بدهی باز ندارد' });
  }
  const payAmount = Math.min(requested, previousDebt);
  supplier.debt = previousDebt - payAmount;

  const nums = (db.supplierPayments || [])
    .map((p) => parseInt(p.id.replace('PAY-', ''), 10))
    .filter((n) => !isNaN(n));
  const maxId = nums.length > 0 ? Math.max(...nums) : 100;

  const paymentRecord = {
    id: `PAY-${maxId + 1}`,
    supplierId: supplier.id,
    supplierName: supplier.name,
    amount: payAmount,
    previousDebt,
    remainingDebt: supplier.debt,
    date: getCurrentDateTime(),
    dateKey: getPersianDateKey(new Date()),
    timestamp: Date.now(),
    note: oneLine(note, 300) || 'پرداخت علی‌الحساب / تسویه دفتری',
  };

  db.supplierPayments.unshift(paymentRecord);
  writeDB(db);

  res.json({ supplier, paymentRecord });
});

app.delete('/api/suppliers/:id', requireAuth('suppliers'), (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.suppliers = db.suppliers.filter((s) => s.id !== id);
  writeDB(db);
  res.json({ message: 'تأمین‌کننده حذف شد' });
});

// ==========================================
// بخش ۴: فاکتورهای خرید و فروش (Purchases & Sales)
// ==========================================

app.get('/api/purchases', requireAuth('suppliers', 'inventory', 'accounting'), (req, res) => {
  const db = readDB();
  res.json(db.purchases || []);
});

// فاکتور خرید: افزایش موجودی انبار + ثبت مانده نسیه به حساب تأمین‌کننده
app.post('/api/purchases', requireAuth('suppliers', 'inventory'), (req, res) => {
  const { supplierId, items, paidAmount, note } = req.body;
  if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'انتخاب تأمین‌کننده و حداقل یک کالا الزامی است' });
  }

  const db = readDB();
  const supplier = db.suppliers.find((s) => s.id === supplierId);
  if (!supplier) {
    return res.status(404).json({ error: 'تأمین‌کننده یافت نشد' });
  }

  // اعتبارسنجی همه‌ی ردیف‌ها قبل از هر تغییری
  for (const row of items) {
    const qty = Number(row.qty);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: 'تعداد هر کالا باید عدد صحیح مثبت باشد' });
    }
    if (nonNegative(row.buyPrice) === null) {
      return res.status(400).json({ error: 'قیمت خرید باید عدد غیرمنفی باشد' });
    }
    if (row.sellPrice !== undefined && row.sellPrice !== '' && nonNegative(row.sellPrice) === null) {
      return res.status(400).json({ error: 'قیمت فروش باید عدد غیرمنفی باشد' });
    }
    const exists = db.inventory.some((i) => i.id === row.productId);
    if (!exists && !(row.name && String(row.name).trim())) {
      return res.status(400).json({ error: 'کالای انتخاب‌شده معتبر نیست' });
    }
  }
  const hasPaid = paidAmount !== undefined && paidAmount !== '' && paidAmount !== null;
  if (hasPaid && nonNegative(paidAmount) === null) {
    return res.status(400).json({ error: 'مبلغ پرداختی نامعتبر است' });
  }

  let totalAmount = 0;
  const processedItems = items.map((row) => {
    const qty = Number(row.qty);
    const buyPrice = Number(row.buyPrice) || 0;
    const sellPrice = Number(row.sellPrice) || 0;
    totalAmount += qty * buyPrice;

    let invItem = db.inventory.find((i) => i.id === row.productId);
    if (invItem) {
      invItem.stock = (Number(invItem.stock) || 0) + qty;
      if (buyPrice > 0) invItem.buyPrice = buyPrice;
      if (sellPrice > 0) invItem.sellPrice = sellPrice;
    } else {
      const nums = db.inventory
        .map((i) => parseInt(i.id.replace('PRD-', ''), 10))
        .filter((n) => !isNaN(n));
      const maxPrdId = nums.length > 0 ? Math.max(...nums) : 100;
      invItem = {
        id: `PRD-${maxPrdId + 1}`,
        name: oneLine(row.name, 120),
        category: row.category || 'قطعات تعمیراتی',
        stock: qty,
        minStock: 1,
        buyPrice,
        sellPrice: sellPrice || Math.round(buyPrice * 1.25),
      };
      db.inventory.unshift(invItem);
    }

    return {
      productId: invItem.id,
      name: invItem.name,
      qty,
      buyPrice,
      sellPrice: invItem.sellPrice,
    };
  });

  // paidAmount خالی = کل مبلغ نقد؛ بیشتر از مجموع فاکتور هم به مجموع محدود می‌شود
  const paid = hasPaid ? Math.min(Number(paidAmount), totalAmount) : totalAmount;
  const debtAmount = totalAmount - paid;

  let paymentType = 'cash';
  if (paid === 0 && debtAmount > 0) paymentType = 'credit';
  else if (paid > 0 && debtAmount > 0) paymentType = 'partial';

  supplier.totalPurchases = (Number(supplier.totalPurchases) || 0) + totalAmount;
  supplier.debt = (Number(supplier.debt) || 0) + debtAmount;

  const nums = db.purchases
    .map((p) => parseInt(p.id.replace('PUR-', ''), 10))
    .filter((n) => !isNaN(n));
  const maxPurId = nums.length > 0 ? Math.max(...nums) : 1000;

  const newPurchase = {
    id: `PUR-${maxPurId + 1}`,
    supplierId: supplier.id,
    supplierName: supplier.name,
    items: processedItems,
    totalAmount,
    paidAmount: paid,
    debtAmount,
    paymentType,
    date: getCurrentDateTime(),
    dateKey: getPersianDateKey(new Date()),
    timestamp: Date.now(),
    note: oneLine(note, 300),
  };

  db.purchases.unshift(newPurchase);
  writeDB(db);

  res.status(201).json({ purchase: newPurchase, supplier });
});

app.get('/api/sales', requireAuth('inventory', 'accounting', 'dashboard'), (req, res) => {
  const db = readDB();
  res.json(db.sales || []);
});

// فاکتور فروش مستقیم کالا
app.post('/api/sales', requireAuth('inventory', 'accounting'), (req, res) => {
  const { customerName, customerPhone, items, note } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'انتخاب حداقل یک کالا برای فروش الزامی است' });
  }

  const db = readDB();

  // اعتبارسنجی (شامل کنترل موجودی، با جمع تعداد ردیف‌های تکراری یک کالا)
  const requested = {};
  for (const row of items) {
    const qty = Number(row.qty);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: 'تعداد هر کالا باید عدد صحیح مثبت باشد' });
    }
    if (row.sellPrice !== undefined && row.sellPrice !== '' && nonNegative(row.sellPrice) === null) {
      return res.status(400).json({ error: 'قیمت فروش باید عدد غیرمنفی باشد' });
    }
    const invItem = db.inventory.find((i) => i.id === row.productId);
    if (!invItem && !(row.name && String(row.name).trim())) {
      return res.status(400).json({ error: 'کالای انتخاب‌شده معتبر نیست' });
    }
    if (invItem) {
      requested[invItem.id] = (requested[invItem.id] || 0) + qty;
      if (requested[invItem.id] > (Number(invItem.stock) || 0)) {
        return res
          .status(400)
          .json({ error: `موجودی «${invItem.name}» کافی نیست (موجودی: ${invItem.stock})` });
      }
    }
  }

  let totalAmount = 0;
  let totalCost = 0;

  const processedItems = items.map((row) => {
    const qty = Number(row.qty);
    const invItem = db.inventory.find((i) => i.id === row.productId);

    const buyPrice = invItem ? Number(invItem.buyPrice) || 0 : 0;
    const sellPrice =
      row.sellPrice !== undefined && row.sellPrice !== ''
        ? Number(row.sellPrice)
        : invItem
        ? Number(invItem.sellPrice) || 0
        : 0;

    if (invItem) invItem.stock = (Number(invItem.stock) || 0) - qty;

    totalAmount += qty * sellPrice;
    totalCost += qty * buyPrice;

    return {
      productId: invItem ? invItem.id : row.productId,
      name: invItem ? invItem.name : oneLine(row.name, 120),
      qty,
      buyPrice,
      sellPrice,
    };
  });

  const nums = db.sales
    .map((s) => parseInt(s.id.replace('SAL-', ''), 10))
    .filter((n) => !isNaN(n));
  const maxSalId = nums.length > 0 ? Math.max(...nums) : 1000;

  const newSale = {
    id: `SAL-${maxSalId + 1}`,
    customerName: oneLine(customerName, 80) || 'مشتری حضوری',
    customerPhone: toEnglishDigits(customerPhone || '').trim(),
    items: processedItems,
    totalAmount,
    totalCost,
    profit: totalAmount - totalCost,
    date: getCurrentDateTime(),
    dateKey: getPersianDateKey(new Date()),
    timestamp: Date.now(),
    note: oneLine(note, 300),
  };

  db.sales.unshift(newSale);
  writeDB(db);

  res.status(201).json(newSale);
});

// ==========================================
// بخش ۵: مدیریت پرسنل، پروفایل مشتری و نظرسنجی
// ==========================================

app.get('/api/staff', requireAdmin, (req, res) => {
  const db = readDB();
  res.json(db.staff || []);
});

app.post('/api/staff', requireAdmin, (req, res) => {
  const { name, phone, permissions } = req.body;
  const cleanPhone = toEnglishDigits(phone || '').trim();
  if (!name || !String(name).trim() || !cleanPhone) {
    return res.status(400).json({ error: 'نام و شماره تماس پرسنل الزامی است' });
  }
  if (!isValidPhone(cleanPhone)) {
    return res.status(400).json({ error: 'شماره موبایل معتبر نیست' });
  }

  const perms = (Array.isArray(permissions) ? permissions : []).filter((p) =>
    ALL_PERMISSIONS.includes(p)
  );
  const finalPerms = perms.length > 0 ? perms : ['dashboard'];

  const db = readDB();
  if (!db.staff) db.staff = [];

  let member = db.staff.find((s) => s.phone === cleanPhone);
  if (member) {
    member.name = oneLine(name, 80);
    member.permissions = finalPerms;
  } else {
    const existingNums = db.staff
      .map((s) => parseInt(s.id.replace('ST-', ''), 10))
      .filter((n) => !isNaN(n));
    const maxStaffId = existingNums.length > 0 ? Math.max(...existingNums) : 0;

    member = {
      id: `ST-${maxStaffId + 1}`,
      name: oneLine(name, 80),
      phone: cleanPhone,
      permissions: finalPerms,
    };
    db.staff.push(member);
  }

  writeDB(db);
  res.json(member);
});

app.delete('/api/staff/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  if (!db.staff) db.staff = [];
  db.staff = db.staff.filter((s) => s.id !== id);
  writeDB(db);
  res.json({ message: 'پرسنل با موفقیت حذف شد' });
});

app.get('/api/customer-profile/:phone', requireAnyUser, (req, res) => {
  const cleanPhone = toEnglishDigits(req.params.phone).trim();
  if (!canAccessCustomer(req.user, cleanPhone)) {
    return res.status(404).json({ error: 'مشتری یافت نشد' });
  }
  const profile = buildCustomerProfile(readDB(), cleanPhone);
  if (!profile) return res.status(404).json({ error: 'مشتری یافت نشد' });
  res.json(profile);
});

app.post('/api/repairs/:id/rating', requireAnyUser, (req, res) => {
  const { id } = req.params;
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'امتیاز باید بین ۱ تا ۵ باشد' });
  }

  const db = readDB();
  const repair = db.repairs.find((r) => r.id === id);
  if (!repair || !canAccessCustomer(req.user, repair.phone)) {
    return res.status(404).json({ error: 'دستگاه یافت نشد' });
  }
  if (repair.status !== 'delivered') {
    return res.status(409).json({ error: 'نظرسنجی بعد از تحویل دستگاه ممکن است' });
  }

  repair.satisfaction = rating;
  repair.feedback = oneLine(req.body.feedback, 500);

  writeDB(db);
  res.json(sanitizeRepairForCustomer(repair));
});

// ==========================================
// پنل پیامک — ارسال گروهی به مشتریان انتخاب‌شده
// ==========================================

app.post('/api/sms/send', requireAuth('sms'), async (req, res) => {
  const { repairIds, message } = req.body;
  const cleanMsg = String(message || '').trim().slice(0, 500);

  if (!cleanMsg || !Array.isArray(repairIds) || repairIds.length === 0) {
    return res.status(400).json({ error: 'گیرندگان و متن پیامک الزامی است' });
  }

  const db = readDB();
  const phones = [
    ...new Set(
      db.repairs
        .filter((r) => repairIds.includes(r.id) && isValidPhone(r.phone))
        .map((r) => r.phone)
    ),
  ];

  if (phones.length === 0) {
    return res.status(404).json({ error: 'شماره معتبری برای ارسال یافت نشد' });
  }

  let sentCount = 0;
  for (const phone of phones) {
    const result = await sendSms(phone, cleanMsg);
    if (result.success) sentCount += 1;
  }

  res.json({ success: true, sentCount, total: phones.length });
});

// ==========================================
// سرو فرانت (production) و مدیریت خطا
// ==========================================

const DIST_DIR = path.join(__dirname, '..', 'panel-app', 'dist');
if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      return res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
    next();
  });
}

app.use('/api', (req, res) => res.status(404).json({ error: 'مسیر یافت نشد' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'بدنه‌ی درخواست JSON معتبر نیست' });
  }
  console.error(err);
  res.status(500).json({ error: 'خطای داخلی سرور' });
});

const PORT = Number(process.env.PORT) || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`A Plus Server running on http://localhost:${PORT}`);
    if (!readDB().adminPhone) {
      console.warn('[warn] ADMIN_PHONE تنظیم نشده؛ ورود مدیر کل ممکن نیست.');
    }
  });
}

module.exports = app;
