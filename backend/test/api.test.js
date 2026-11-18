const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const fs = require('fs');

const tmpDb = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'aplus-')), 'db.json');
process.env.DB_FILE = tmpDb;
process.env.ADMIN_PHONE = '09100000000';
process.env.NODE_ENV = 'test';
delete process.env.SMS_USERNAME;

let lastOtp = null;
const origLog = console.log;
console.log = (...a) => {
  const m = String(a[0]).match(/کد ورود (\d+): (\d{5})/);
  if (m) lastOtp = { phone: m[1], code: m[2] };
  else origLog(...a);
};

const app = require('../server');
let server, base;
before(async () => {
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const call = async (method, url, body, token) => {
  const res = await fetch(base + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
};

const login = async (phone, isAdminMode) => {
  const r1 = await call('POST', '/api/auth/request-otp', { phone, isAdminMode });
  assert.equal(r1.status, 200, JSON.stringify(r1.data));
  const r2 = await call('POST', '/api/auth/verify-otp', { phone, isAdminMode, code: lastOtp.code });
  assert.equal(r2.status, 200, JSON.stringify(r2.data));
  return r2.data;
};

let adminToken, staffToken, custToken;

test('بدون توکن همه چیز 401', async () => {
  for (const [m, u] of [['GET', '/api/repairs'], ['GET', '/api/customers'], ['DELETE', '/api/repairs/AP-1005'], ['GET', '/api/staff'], ['POST', '/api/sales']]) {
    assert.equal((await call(m, u, {})).status, 401, `${m} ${u}`);
  }
});

test('توکن جعلی/دستکاری‌شده رد می‌شود', async () => {
  assert.equal((await call('GET', '/api/repairs', null, 'abc.def')).status, 401);
  const real = (await login('09100000000', true)).token;
  const tampered = real.slice(0, -3) + 'AAA';
  assert.equal((await call('GET', '/api/repairs', null, tampered)).status, 401);
});

test('OTP: کد اشتباه رد، ارسال مجدد زودهنگام 429، کد یکبارمصرف', async () => {
  await call('POST', '/api/auth/request-otp', { phone: '09121111111', isAdminMode: false });
  const good = lastOtp.code;
  const bad = good === '00000' ? '11111' : '00000';
  assert.equal((await call('POST', '/api/auth/verify-otp', { phone: '09121111111', isAdminMode: false, code: bad })).status, 401);
  assert.equal((await call('POST', '/api/auth/request-otp', { phone: '09121111111', isAdminMode: false })).status, 429);
  assert.equal((await call('POST', '/api/auth/verify-otp', { phone: '09121111111', isAdminMode: false, code: good })).status, 200);
  assert.equal((await call('POST', '/api/auth/verify-otp', { phone: '09121111111', isAdminMode: false, code: good })).status, 401);
});

test('شماره ناشناس: مشتری 404، مدیریتی پاسخ یکسان (بدون نشت)', async () => {
  assert.equal((await call('POST', '/api/auth/request-otp', { phone: '09999999999', isAdminMode: false })).status, 404);
  const r = await call('POST', '/api/auth/request-otp', { phone: '09999999999', isAdminMode: true });
  assert.equal(r.status, 200);
  assert.equal((await call('POST', '/api/auth/verify-otp', { phone: '09999999999', isAdminMode: true, code: '12345' })).status, 401);
});

test('ورود مدیر، پرسنل، مشتری', async () => {
  adminToken = (await login('09100000000', true)).token;
  staffToken = (await login('09120000001', true)).token; // پرسنل نمونه
  const c = await login('09122222222', false);
  custToken = c.token;
  assert.equal(c.customerData.phone, '09122222222');
  assert.equal(c.customerData.repairs[0].partCost, undefined, 'فیلد مالی نباید به مشتری برسد');
});

test('مشتری به API پرسنل و پروفایل دیگران دسترسی ندارد', async () => {
  assert.equal((await call('GET', '/api/repairs', null, custToken)).status, 403);
  assert.equal((await call('GET', '/api/customer-profile/09121111111', null, custToken)).status, 404);
  assert.equal((await call('GET', '/api/customer-profile/09122222222', null, custToken)).status, 200);
  // تایید هزینه‌ی دستگاه دیگران (AP-1003 مال محمد است)
  assert.equal((await call('POST', '/api/repairs/AP-1003/approve-cost', { approved: true }, custToken)).status, 404);
  // دستگاه خودش (AP-1004 در حال تعمیر)
  const ok = await call('POST', '/api/repairs/AP-1004/approve-cost', { approved: true }, custToken);
  assert.equal(ok.status, 200);
  assert.equal(ok.data.costApproved, 'approved');
});

test('پرسنل: بدون دسترسی settings/accounting ممنوع، مدیریت پرسنل فقط مدیر', async () => {
  assert.equal((await call('GET', '/api/staff', null, staffToken)).status, 403);
  assert.equal((await call('POST', '/api/staff', { name: 'x', phone: '09130000000', permissions: ['settings'] }, staffToken)).status, 403);
  assert.equal((await call('GET', '/api/repairs', null, staffToken)).status, 200);
  const added = await call('POST', '/api/staff', { name: 'تست', phone: '09130000000', permissions: ['bogus', 'dashboard'] }, adminToken);
  assert.deepEqual(added.data.permissions, ['dashboard']);
});

test('اعتبارسنجی ورودی‌ها', async () => {
  assert.equal((await call('POST', '/api/repairs', { name: 'a', phone: '123', device: 'd', issue: 'i' }, adminToken)).status, 400);
  assert.equal((await call('POST', '/api/inventory', { name: 'x', stock: -5 }, adminToken)).status, 400);
  assert.equal((await call('POST', '/api/sales', { items: [{ productId: 'PRD-104', qty: 999 }] }, adminToken)).status, 400);
  assert.equal((await call('POST', '/api/sales', { items: [{ productId: 'PRD-104', qty: -1 }] }, adminToken)).status, 400);
  assert.equal((await call('PUT', '/api/repairs/AP-1005/status', { status: 'hacked' }, adminToken)).status, 400);
});

test('هدیه معرف + کیف پول حداکثر به اندازه هزینه + سود + برگشت', async () => {
  // مشتری جدید با کد معرف رضا (AP-1111)
  const created = await call('POST', '/api/repairs', { name: 'علی', phone: '09150000000', device: 'گوشی', issue: 'شکستگی', referredByCode: 'AP-1111' }, adminToken);
  assert.equal(created.status, 201);
  const id = created.data.id;
  const reza = async () => (await call('GET', '/api/customers', null, adminToken)).data.find((c) => c.phone === '09121111111');
  const before = (await reza()).walletBalance; // 200000

  await call('PUT', `/api/repairs/${id}/status`, { status: 'in_progress', estimatedCost: 100000, technicalIssue: 'x' }, adminToken);

  // به مشتری جدید کیف پول بزرگ‌تر از هزینه می‌دهیم تا سقف کسر تست شود
  // (از طریق معرف دیگری ممکن نیست؛ پس دستی در db)
  const db = JSON.parse(fs.readFileSync(tmpDb, 'utf-8'));
  db.customers.find((c) => c.phone === '09150000000').walletBalance = 300000;
  fs.writeFileSync(tmpDb, JSON.stringify(db));

  const del = await call('PUT', `/api/repairs/${id}/status`, { status: 'delivered', useWallet: true, receivedAmount: 0, partCost: 20000, courierCost: 5000, inventoryItemId: 'PRD-102' }, adminToken);
  assert.equal(del.status, 200);
  assert.equal(del.data.repair.walletDeducted, 100000, 'فقط به اندازه هزینه کسر شود نه کل موجودی');
  assert.equal(del.data.repair.profit, -25000);
  assert.equal(del.data.repair.referralRewardPaid, true);
  assert.equal((await reza()).walletBalance, before + 200000);
  const cust = (await call('GET', '/api/customers', null, adminToken)).data.find((c) => c.phone === '09150000000');
  assert.equal(cust.walletBalance, 200000);
  const stockAfter = (await call('GET', '/api/inventory', null, adminToken)).data.find((i) => i.id === 'PRD-102').stock;
  assert.equal(stockAfter, 4);

  // تحویل دوباره (ویرایش) نباید دوباره کسر/پاداش بدهد
  await call('PUT', `/api/repairs/${id}/status`, { status: 'delivered', useWallet: true, receivedAmount: 50000, inventoryItemId: 'PRD-102' }, adminToken);
  assert.equal((await reza()).walletBalance, before + 200000);
  assert.equal((await call('GET', '/api/inventory', null, adminToken)).data.find((i) => i.id === 'PRD-102').stock, 4);

  // برگشت به ready: همه چیز برگردد
  await call('PUT', `/api/repairs/${id}/status`, { status: 'ready' }, adminToken);
  assert.equal((await reza()).walletBalance, before);
  assert.equal((await call('GET', '/api/inventory', null, adminToken)).data.find((i) => i.id === 'PRD-102').stock, 5);
  const c2 = (await call('GET', '/api/customers', null, adminToken)).data.find((c) => c.phone === '09150000000');
  assert.equal(c2.walletBalance, 300000);
});

test('پرداخت به تأمین‌کننده: بیش از بدهی محدود می‌شود؛ بدون بدهی 409', async () => {
  const r = await call('POST', '/api/suppliers/SUP-1/pay', { amount: 99999999 }, adminToken);
  assert.equal(r.status, 200);
  assert.equal(r.data.paymentRecord.amount, 2500000);
  assert.equal(r.data.supplier.debt, 0);
  assert.equal((await call('POST', '/api/suppliers/SUP-1/pay', { amount: 10 }, adminToken)).status, 409);
});

test('فروش موجودی را درست کم می‌کند و فاکتور خرید تعداد نامعتبر را رد می‌کند', async () => {
  const s = await call('POST', '/api/sales', { items: [{ productId: 'PRD-104', qty: 2 }] }, adminToken);
  assert.equal(s.status, 201);
  assert.equal((await call('GET', '/api/inventory', null, adminToken)).data.find((i) => i.id === 'PRD-104').stock, 6);
  assert.equal((await call('POST', '/api/purchases', { supplierId: 'SUP-2', items: [{ productId: 'PRD-104', qty: 0, buyPrice: 10 }] }, adminToken)).status, 400);
  const p = await call('POST', '/api/purchases', { supplierId: 'SUP-2', items: [{ productId: 'PRD-104', qty: 2, buyPrice: 1000 }], paidAmount: 500 }, adminToken);
  assert.equal(p.status, 201);
  assert.equal(p.data.purchase.debtAmount, 1500);
});

test('db.json اتمیک نوشته می‌شود و JSON معتبر است', () => {
  assert.doesNotThrow(() => JSON.parse(fs.readFileSync(tmpDb, 'utf-8')));
  assert.equal(fs.existsSync(tmpDb + '.tmp'), false);
});
