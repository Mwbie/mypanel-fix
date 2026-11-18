const crypto = require('crypto');

const IS_PROD = process.env.NODE_ENV === 'production';

let SECRET = process.env.AUTH_SECRET;
if (!SECRET) {
  if (IS_PROD) {
    console.error('AUTH_SECRET باید در حالت production تنظیم شود.');
    process.exit(1);
  }
  SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('[auth] AUTH_SECRET ست نشده؛ یک کلید موقت ساخته شد (با ری‌استارت سرور همه از سیستم خارج می‌شوند).');
}

// ---------- توکن امضاشده (مشابه JWT، بدون وابستگی خارجی) ----------
const b64url = (buf) => Buffer.from(buf).toString('base64url');

const sign = (payload, ttlSeconds) => {
  const body = b64url(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds })
  );
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
};

const verify = (token) => {
  if (typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest();
  let given;
  try {
    given = Buffer.from(sig, 'base64url');
  } catch {
    return null;
  }
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
};

// ---------- کد یکبارمصرف (OTP) ----------
const OTP_TTL_MS = 2 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const otpStore = new Map(); // key -> { hash, expires, attempts, sentAt }

const hashOtp = (key, code) =>
  crypto.createHmac('sha256', SECRET).update(`${key}:${code}`).digest('hex');

const createOtp = (key) => {
  const prev = otpStore.get(key);
  const now = Date.now();
  if (prev && now - prev.sentAt < OTP_RESEND_MS) {
    const wait = Math.ceil((OTP_RESEND_MS - (now - prev.sentAt)) / 1000);
    return { error: `لطفاً ${wait} ثانیه دیگر دوباره تلاش کنید.`, wait };
  }
  const code = String(crypto.randomInt(0, 100000)).padStart(5, '0');
  otpStore.set(key, {
    hash: hashOtp(key, code),
    expires: now + OTP_TTL_MS,
    attempts: 0,
    sentAt: now,
  });
  return { code };
};

const checkOtp = (key, code) => {
  const rec = otpStore.get(key);
  if (!rec || rec.expires < Date.now()) {
    otpStore.delete(key);
    return { ok: false, error: 'کد منقضی شده یا درخواست نشده است. دوباره کد بگیرید.' };
  }
  rec.attempts += 1;
  if (rec.attempts > OTP_MAX_ATTEMPTS) {
    otpStore.delete(key);
    return { ok: false, error: 'تعداد تلاش‌های ناموفق زیاد بود. دوباره کد بگیرید.' };
  }
  const a = Buffer.from(rec.hash, 'hex');
  const b = Buffer.from(hashOtp(key, String(code)), 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, error: 'کد وارد شده اشتباه است.' };
  }
  otpStore.delete(key); // یکبارمصرف
  return { ok: true };
};

// پاکسازی دوره‌ای
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of otpStore) if (v.expires < now) otpStore.delete(k);
}, 60 * 1000).unref();

// ---------- محدودکننده‌ی نرخ ساده (بر اساس IP) ----------
const rateLimit = ({ windowMs, max, message }) => {
  const hits = new Map();
  setInterval(() => hits.clear(), windowMs).unref();
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const n = (hits.get(ip) || 0) + 1;
    hits.set(ip, n);
    if (n > max) {
      return res.status(429).json({ error: message || 'درخواست‌های زیاد؛ کمی بعد تلاش کنید.' });
    }
    next();
  };
};

module.exports = { sign, verify, createOtp, checkOtp, rateLimit, IS_PROD };
