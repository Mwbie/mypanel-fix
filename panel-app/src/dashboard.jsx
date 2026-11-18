import { useState, useEffect, useMemo } from "react";
import {
  Wrench,
  Users,
  X,
  ClipboardList,
  ShieldCheck,
  XCircle,
} from "lucide-react";

// ۱. ایمپورت کامپوننت‌های Layout
import Sidebar from "./components/layout/Sidebar";
import MobileHeader from "./components/layout/MobileHeader";

// ۲. ایمپورت کامپوننت‌های Tabs (هر ۷ تب اصلی سیستم)
import RepairsTab from "./components/tabs/RepairsTab";
import CustomersTab from "./components/tabs/CustomersTab";
import InventoryTab from "./components/tabs/InventoryTab";
import SuppliersTab from "./components/tabs/SuppliersTab";
import AccountingTab from "./components/tabs/AccountingTab";
import SmsTab from "./components/tabs/SmsTab";
import SettingsTab from "./components/tabs/SettingsTab";

// ۳. ایمپورت کامپوننت‌های Modals (کاردکس‌ها و فاکتورها)
import ProductCardexModal from "./components/modals/ProductCardexModal";
import SupplierCardexModal from "./components/modals/SupplierCardexModal";
import SupplierModal from "./components/modals/SupplierModal";
import PaySupplierModal from "./components/modals/PaySupplierModal";
import PurchaseModal from "./components/modals/PurchaseModal";
import SaleModal from "./components/modals/SaleModal";

const STATUS_LABELS = {
  received: "پذیرش دستگاه",
  in_progress: "در حال تعمیر",
  ready: "آماده تحویل",
  delivered: "تحویل مشتری",
  unrepairable: "غیرقابل تعمیر",
};

const normalizePhone = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .trim();
};

export default function MobileRepairDashboard({
  userRole = "admin",
  userData = null,
  onLogout,
}) {
  // ==========================================================================
  // [SECTION 1] Stateهای اصلی داده‌ها
  // ==========================================================================
  const [repairs, setRepairs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);

  // فیلترها و وضعیت تب‌ها
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [smsMessage, setSmsMessage] = useState("");
  const [accountingDateFilter, setAccountingDateFilter] = useState("all");
  const [dashboardTab, setDashboardTab] = useState("active");

  // مدیریت تم تاریک
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("aplus_theme") === "dark";
  });

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("aplus_theme", next ? "dark" : "light");
  };

  // دسترسی‌های کاربر واردشده
  const permissions = useMemo(() => {
    if (userRole === "admin") {
      return [
        "dashboard",
        "customers",
        "inventory",
        "suppliers",
        "accounting",
        "sms",
        "settings",
      ];
    }
    return userData?.permissions?.length > 0
      ? userData.permissions
      : ["dashboard"];
  }, [userRole, userData]);

  const [activeMenu, setActiveMenu] = useState(() => {
    return permissions.includes("dashboard") ? "dashboard" : permissions[0];
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ==========================================================================
  // [SECTION 2] Stateهای مودال‌ها
  // ==========================================================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newRepair, setNewRepair] = useState({
    name: "",
    phone: "",
    device: "",
    issue: "",
    referredByCode: "",
  });

  const [inProgressModal, setInProgressModal] = useState({
    isOpen: false,
    repair: null,
    technicalIssue: "",
    estimatedCost: "",
    estimatedReadyTime: "",
  });

  const [deliveryModal, setDeliveryModal] = useState({
    isOpen: false,
    repair: null,
    serviceDescription: "",
    warrantyMonths: 0,
    partCost: "",
    courierCost: "",
    receivedAmount: "",
    useWallet: false,
    inventoryItemId: "",
  });
  const [deliveryPartSearch, setDeliveryPartSearch] = useState("");
  const [showDeliveryPartDropdown, setShowDeliveryPartDropdown] =
    useState(false);

  const [unrepairableModal, setUnrepairableModal] = useState({
    isOpen: false,
    repair: null,
    reason: "",
  });

  const [customerProfileModal, setCustomerProfileModal] = useState({
    isOpen: false,
    customer: null,
  });

  const [itemModal, setItemModal] = useState({
    isOpen: false,
    id: null,
    name: "",
    category: "قطعات تعمیراتی",
    stock: "",
    minStock: "1",
    buyPrice: "",
    sellPrice: "",
  });

  const [supplierModal, setSupplierModal] = useState({
    isOpen: false,
    id: null,
    name: "",
    phone: "",
    address: "",
    initialDebt: "0",
  });

  const [paySupplierModal, setPaySupplierModal] = useState({
    isOpen: false,
    supplier: null,
    amount: "",
    note: "",
  });

  const [purchaseModal, setPurchaseModal] = useState({
    isOpen: false,
    supplierId: "",
    productId: "",
    qty: 1,
    buyPrice: "",
    sellPrice: "",
    paidAmount: "",
    note: "",
  });

  const [saleModal, setSaleModal] = useState({
    isOpen: false,
    customerName: "",
    customerPhone: "",
    productId: "",
    qty: 1,
    sellPrice: "",
    note: "",
  });

  const [productCardexModal, setProductCardexModal] = useState({
    isOpen: false,
    productId: null,
  });

  const [supplierCardexModal, setSupplierCardexModal] = useState({
    isOpen: false,
    supplierId: null,
  });

  // ==========================================================================
  // [SECTION 3] توابع ارتباط با سرور (API Handlers)
  // ==========================================================================

  const fetchData = async () => {
    try {
      const [
        repairsRes,
        customersRes,
        staffRes,
        invRes,
        suppRes,
        purchasesRes,
        salesRes,
      ] = await Promise.all([
        fetch("/api/repairs"),
        fetch("/api/customers"),
        fetch("/api/staff"),
        fetch("/api/inventory"),
        fetch("/api/suppliers"),
        fetch("/api/purchases"),
        fetch("/api/sales"),
      ]);

      if (repairsRes.ok) setRepairs(await repairsRes.json());
      if (customersRes.ok) setCustomers(await customersRes.json());
      if (staffRes.ok) setStaffList(await staffRes.json());
      if (invRes.ok) setInventory(await invRes.json());
      if (suppRes.ok) {
        const suppData = await suppRes.json();
        setSuppliers(suppData.suppliers || []);
      }
      if (purchasesRes.ok) setPurchases(await purchasesRes.json());
      if (salesRes.ok) setSales(await salesRes.json());
    } catch (err) {
      console.error("خطا در دریافت اطلاعات از سرور:", err);
    }
  };
  useEffect(() => {
    const initLoad = async () => {
      await fetchData();
    };
    initLoad();
  }, []);
  const updateStatusRequest = async (id, payload) => {
    try {
      const res = await fetch(`/api/repairs/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error("خطا در بروزرسانی وضعیت:", err);
    }
  };

  const handleStatusSelectChange = (item, newStatus) => {
    if (newStatus === "in_progress") {
      setInProgressModal({
        isOpen: true,
        repair: item,
        technicalIssue: item.technicalIssue || item.issue || "",
        estimatedCost: item.estimatedCost ? String(item.estimatedCost) : "",
        estimatedReadyTime: item.estimatedReadyTime || "",
      });
    } else if (newStatus === "delivered") {
      const existingPart = inventory.find((i) => i.id === item.inventoryItemId);
      setDeliveryPartSearch(existingPart ? existingPart.name : "");
      setDeliveryModal({
        isOpen: true,
        repair: item,
        serviceDescription:
          item.serviceDescription || item.technicalIssue || item.issue || "",
        warrantyMonths: item.warrantyMonths || 0,
        partCost: item.partCost ? String(item.partCost) : "",
        courierCost: item.courierCost ? String(item.courierCost) : "",
        receivedAmount: item.receivedAmount
          ? String(item.receivedAmount)
          : item.estimatedCost
            ? String(item.estimatedCost)
            : "",
        useWallet: false,
        inventoryItemId: item.inventoryItemId || "",
      });
    } else if (newStatus === "unrepairable") {
      setUnrepairableModal({
        isOpen: true,
        repair: item,
        reason: item.technicalIssue || "",
      });
    } else {
      updateStatusRequest(item.id, { status: newStatus });
    }
  };

  const handleConfirmInProgress = async (e) => {
    e.preventDefault();
    if (!inProgressModal.repair) return;
    await updateStatusRequest(inProgressModal.repair.id, {
      status: "in_progress",
      technicalIssue: inProgressModal.technicalIssue.trim(),
      estimatedCost: Number(inProgressModal.estimatedCost) || 0,
      estimatedReadyTime: inProgressModal.estimatedReadyTime.trim(),
    });
    setInProgressModal({
      isOpen: false,
      repair: null,
      technicalIssue: "",
      estimatedCost: "",
      estimatedReadyTime: "",
    });
  };

  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (!deliveryModal.repair) return;

    await updateStatusRequest(deliveryModal.repair.id, {
      status: "delivered",
      serviceDescription: deliveryModal.serviceDescription.trim(),
      warrantyMonths: Number(deliveryModal.warrantyMonths) || 0,
      partCost: Number(deliveryModal.partCost) || 0,
      courierCost: Number(deliveryModal.courierCost) || 0,
      receivedAmount: Number(deliveryModal.receivedAmount) || 0,
      useWallet: deliveryModal.useWallet,
      inventoryItemId: deliveryModal.inventoryItemId || null,
    });

    // بستن مودال و رفرش کامل اطلاعات از سرور
    setDeliveryModal({
      isOpen: false,
      repair: null,
      serviceDescription: "",
      warrantyMonths: 0,
      partCost: "",
      courierCost: "",
      receivedAmount: "",
      useWallet: false,
      inventoryItemId: "",
    });

    // فراخوانی مجدد داده‌ها برای سینک شدن لحظه‌ای فیلترهای ادمین
    await fetchData();
  };

  const handleConfirmUnrepairable = async (e) => {
    e.preventDefault();
    if (!unrepairableModal.repair) return;
    await updateStatusRequest(unrepairableModal.repair.id, {
      status: "unrepairable",
      technicalIssue: unrepairableModal.reason.trim(),
    });
    setUnrepairableModal({ isOpen: false, repair: null, reason: "" });
  };

  const handleDeleteRepair = async (id, customerName, deviceName) => {
    if (
      !window.confirm(
        `آیا از حذف پذیرش دستگاه «${deviceName}» متعلق به «${customerName}» مطمئن هستید؟`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/repairs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUseWallet = async (phone, name, currentBalance) => {
    if (
      !window.confirm(
        `موجودی کیف پول ${name} مبلغ ${currentBalance.toLocaleString()} تومان است.\nآیا این تخفیف روی فاکتور مشتری اعمال و از کیف پولش کسر شود؟`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/customers/${phone}/wallet/deduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: currentBalance }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRepair = async (e) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(newRepair.phone);
    if (!newRepair.name || !cleanPhone || !newRepair.device || !newRepair.issue)
      return;

    try {
      const res = await fetch("/api/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRepair.name.trim(),
          phone: cleanPhone,
          device: newRepair.device.trim(),
          issue: newRepair.issue.trim(),
          referredByCode: newRepair.referredByCode.trim(),
        }),
      });
      if (res.ok) {
        await fetchData();
        setIsModalOpen(false);
        setNewRepair({
          name: "",
          phone: "",
          device: "",
          issue: "",
          referredByCode: "",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveInventory = async (e) => {
    e.preventDefault();
    if (!itemModal.name.trim()) return;
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemModal.id,
          name: itemModal.name.trim(),
          category: itemModal.category,
          stock: Number(itemModal.stock) || 0,
          minStock: Number(itemModal.minStock) || 1,
          buyPrice: Number(itemModal.buyPrice) || 0,
          sellPrice: Number(itemModal.sellPrice) || 0,
        }),
      });
      if (res.ok) {
        setItemModal({
          isOpen: false,
          id: null,
          name: "",
          category: "قطعات تعمیراتی",
          stock: "",
          minStock: "1",
          buyPrice: "",
          sellPrice: "",
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInventory = async (id, name) => {
    if (!window.confirm(`آیا از حذف کالای «${name}» از انبار مطمئن هستید؟`))
      return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!supplierModal.name.trim()) return;
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: supplierModal.id,
          name: supplierModal.name.trim(),
          phone: normalizePhone(supplierModal.phone),
          address: supplierModal.address.trim(),
          initialDebt: Number(supplierModal.initialDebt) || 0,
        }),
      });
      if (res.ok) {
        setSupplierModal({
          isOpen: false,
          id: null,
          name: "",
          phone: "",
          address: "",
          initialDebt: "0",
        });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSupplier = async (id, name) => {
    if (!window.confirm(`آیا از حذف طرف حساب «${name}» مطمئن هستید؟`)) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePaySupplier = async (e) => {
    e.preventDefault();
    if (!paySupplierModal.supplier || !paySupplierModal.amount) return;
    try {
      const res = await fetch(
        `/api/suppliers/${paySupplierModal.supplier.id}/pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(paySupplierModal.amount),
            note: paySupplierModal.note.trim(),
          }),
        },
      );
      if (res.ok) {
        setPaySupplierModal({
          isOpen: false,
          supplier: null,
          amount: "",
          note: "",
        });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    const invItem = inventory.find((i) => i.id === purchaseModal.productId);
    if (!purchaseModal.supplierId || !invItem) {
      alert("لطفاً تأمین‌کننده و کالا را از لیست انتخاب کنید.");
      return;
    }

    const buyPrice =
      Number(purchaseModal.buyPrice) || Number(invItem.buyPrice) || 0;
    const sellPrice =
      Number(purchaseModal.sellPrice) || Number(invItem.sellPrice) || 0;
    const qty = Number(purchaseModal.qty) || 1;
    const total = buyPrice * qty;
    const paid =
      purchaseModal.paidAmount !== "" &&
      purchaseModal.paidAmount !== null &&
      purchaseModal.paidAmount !== undefined
        ? Number(purchaseModal.paidAmount)
        : total;

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: purchaseModal.supplierId,
          items: [
            {
              productId: invItem.id,
              name: invItem.name,
              qty,
              buyPrice,
              sellPrice,
            },
          ],
          paidAmount: paid,
          note: purchaseModal.note.trim(),
        }),
      });
      if (res.ok) {
        setPurchaseModal({
          isOpen: false,
          supplierId: "",
          productId: "",
          qty: 1,
          buyPrice: "",
          sellPrice: "",
          paidAmount: "",
          note: "",
        });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSale = async (e) => {
    e.preventDefault();
    const invItem = inventory.find((i) => i.id === saleModal.productId);
    if (!invItem) {
      alert("لطفاً کالا را انتخاب کنید.");
      return;
    }

    const sellPrice =
      Number(saleModal.sellPrice) || Number(invItem.sellPrice) || 0;
    const qty = Number(saleModal.qty) || 1;

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: saleModal.customerName.trim() || "مشتری حضوری",
          customerPhone: normalizePhone(saleModal.customerPhone),
          items: [
            {
              productId: invItem.id,
              name: invItem.name,
              qty,
              sellPrice,
            },
          ],
          note: saleModal.note.trim(),
        }),
      });
      if (res.ok) {
        setSaleModal({
          isOpen: false,
          customerName: "",
          customerPhone: "",
          productId: "",
          qty: 1,
          sellPrice: "",
          note: "",
        });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================================================
  // [SECTION 4] محاسبات و فیلترها (Memoized Values)
  // ==========================================================================
  const activeRepairs = useMemo(
    () =>
      repairs.filter(
        (r) =>
          r.status === "received" ||
          r.status === "in_progress" ||
          r.status === "ready",
      ),
    [repairs],
  );

  const archivedRepairs = useMemo(
    () =>
      repairs.filter(
        (r) => r.status === "delivered" || r.status === "unrepairable",
      ),
    [repairs],
  );

  const displayedDashboardRepairs = useMemo(() => {
    const list = dashboardTab === "active" ? activeRepairs : archivedRepairs;
    return list.filter((item) => {
      const matchesSearch =
        item.name.includes(searchTerm) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.includes(searchTerm) ||
        item.device.includes(searchTerm) ||
        (item.issue && item.issue.includes(searchTerm));
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [dashboardTab, activeRepairs, archivedRepairs, searchTerm, statusFilter]);

  const filteredDeliveryParts = useMemo(() => {
    if (!deliveryPartSearch.trim()) return inventory;
    return inventory.filter(
      (i) =>
        i.name.toLowerCase().includes(deliveryPartSearch.toLowerCase()) ||
        i.id.toLowerCase().includes(deliveryPartSearch.toLowerCase()),
    );
  }, [inventory, deliveryPartSearch]);

  const deliveredRepairs = useMemo(
    () => repairs.filter((r) => r.status === "delivered"),
    [repairs],
  );
  const [currentTime] = useState(() => Date.now());
  const filteredDeliveredRepairs = useMemo(() => {
    if (accountingDateFilter === "all") return deliveredRepairs;
    const now = currentTime;
    const oneDay = 24 * 60 * 60 * 1000;

    return deliveredRepairs.filter((r) => {
      if (!r.deliveryTimestamp) return true;
      const diff = now - r.deliveryTimestamp;
      if (accountingDateFilter === "today") return diff <= oneDay;
      if (accountingDateFilter === "7days") return diff <= 7 * oneDay;
      if (accountingDateFilter === "30days") return diff <= 30 * oneDay;
      return true;
    });
  }, [deliveredRepairs, accountingDateFilter, currentTime]);

  const accountingStats = useMemo(() => {
    return filteredDeliveredRepairs.reduce(
      (acc, curr) => {
        const received = Number(curr.receivedAmount) || 0;
        const part = Number(curr.partCost) || 0;
        const courier = Number(curr.courierCost) || 0;
        const wallet = Number(curr.walletDeducted) || 0;
        const profit = received - (part + courier);

        acc.totalRevenue += received;
        acc.totalPartCost += part;
        acc.totalCourierCost += courier;
        acc.totalWalletDeducted += wallet;
        acc.totalProfit += profit;
        return acc;
      },
      {
        totalRevenue: 0,
        totalPartCost: 0,
        totalCourierCost: 0,
        totalWalletDeducted: 0,
        totalProfit: 0,
      },
    );
  }, [filteredDeliveredRepairs]);

  const totalSupplierDebt = useMemo(
    () => suppliers.reduce((sum, s) => sum + (Number(s.debt) || 0), 0),
    [suppliers],
  );

  const lowStockItems = useMemo(
    () =>
      inventory.filter(
        (i) => (Number(i.stock) || 0) <= (Number(i.minStock) || 1),
      ),
    [inventory],
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedDashboardRepairs.length)
      setSelectedIds([]);
    else setSelectedIds(displayedDashboardRepairs.map((r) => r.id));
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSendSms = (e) => {
    e.preventDefault();
    if (!smsMessage.trim() || selectedIds.length === 0) return;
    alert(
      `پیامک با موفقیت به ${selectedIds.length} مخاطب ارسال شد.\nمتن پیام: ${smsMessage}`,
    );
    setSmsMessage("");
    setSelectedIds([]);
  };

  const liveModalProfit = useMemo(() => {
    const rec = Number(deliveryModal.receivedAmount) || 0;
    const part = Number(deliveryModal.partCost) || 0;
    const cour = Number(deliveryModal.courierCost) || 0;
    return rec - (part + cour);
  }, [
    deliveryModal.receivedAmount,
    deliveryModal.partCost,
    deliveryModal.courierCost,
  ]);

  const matchingCustomers = useMemo(() => {
    const clean = normalizePhone(newRepair.phone);
    const name = newRepair.name.trim();
    if (!clean && !name) return [];
    return customers.filter(
      (c) =>
        (clean && c.phone.includes(clean)) || (name && c.name.includes(name)),
    );
  }, [customers, newRepair.phone, newRepair.name]);

  const selectedExistingCustomer = useMemo(() => {
    const clean = normalizePhone(newRepair.phone);
    return customers.find((c) => c.phone === clean);
  }, [customers, newRepair.phone]);

  // ==========================================================================
  // [SECTION 5] رندر ماژولار صفحه و تب‌ها
  // ==========================================================================
  return (
    <div
      className={`${
        isDarkMode
          ? "dark bg-slate-900 text-slate-100"
          : "bg-[#f1f5f9] text-slate-800"
      } flex flex-col md:flex-row h-screen font-sans dir-rtl overflow-hidden transition-colors duration-200`}
    >
      <MobileHeader
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        permissions={permissions}
        userData={userData}
        userRole={userRole}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onLogout={onLogout}
      />

      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        permissions={permissions}
        customersCount={customers.length}
        userData={userData}
        userRole={userRole}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onLogout={onLogout}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeMenu === "dashboard" && permissions.includes("dashboard") && (
          <RepairsTab
            isDarkMode={isDarkMode}
            setIsModalOpen={setIsModalOpen}
            dashboardTab={dashboardTab}
            setDashboardTab={setDashboardTab}
            activeRepairsCount={activeRepairs.length}
            archivedRepairsCount={archivedRepairs.length}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            displayedDashboardRepairs={displayedDashboardRepairs}
            handleStatusSelectChange={handleStatusSelectChange}
            handleUseWallet={handleUseWallet}
            handleDeleteRepair={handleDeleteRepair}
          />
        )}

        {activeMenu === "customers" && permissions.includes("customers") && (
          <CustomersTab
            isDarkMode={isDarkMode}
            customers={customers}
            setCustomerProfileModal={setCustomerProfileModal}
          />
        )}

        {activeMenu === "inventory" && permissions.includes("inventory") && (
          <InventoryTab
            isDarkMode={isDarkMode}
            inventory={inventory}
            purchases={purchases}
            sales={sales}
            suppliers={suppliers}
            lowStockItems={lowStockItems}
            setItemModal={setItemModal}
            setPurchaseModal={setPurchaseModal}
            setSaleModal={setSaleModal}
            setProductCardexModal={setProductCardexModal}
            handleDeleteInventory={handleDeleteInventory}
          />
        )}

        {activeMenu === "suppliers" && permissions.includes("suppliers") && (
          <SuppliersTab
            isDarkMode={isDarkMode}
            suppliers={suppliers}
            totalSupplierDebt={totalSupplierDebt}
            setSupplierModal={setSupplierModal}
            setSupplierCardexModal={setSupplierCardexModal}
            setPaySupplierModal={setPaySupplierModal}
            handleDeleteSupplier={handleDeleteSupplier}
          />
        )}

        {activeMenu === "accounting" && permissions.includes("accounting") && (
          <AccountingTab
            isDarkMode={isDarkMode}
            accountingDateFilter={accountingDateFilter}
            setAccountingDateFilter={setAccountingDateFilter}
            accountingStats={accountingStats}
            filteredDeliveredRepairs={filteredDeliveredRepairs}
          />
        )}

        {activeMenu === "sms" && permissions.includes("sms") && (
          <SmsTab
            isDarkMode={isDarkMode}
            displayedDashboardRepairs={displayedDashboardRepairs}
            selectedIds={selectedIds}
            toggleSelectAll={toggleSelectAll}
            toggleSelectOne={toggleSelectOne}
            smsMessage={smsMessage}
            setSmsMessage={setSmsMessage}
            handleSendSms={handleSendSms}
          />
        )}

        {activeMenu === "settings" && permissions.includes("settings") && (
          <SettingsTab
            isDarkMode={isDarkMode}
            staffList={staffList}
            fetchData={fetchData}
          />
        )}
      </main>

      {/* =====================================================================
          [SECTION 6] مودال‌های ماژولار انبار، کاردکس و تأمین‌کنندگان
      ===================================================================== */}
      <ProductCardexModal
        isOpen={productCardexModal.isOpen}
        productId={productCardexModal.productId}
        onClose={() =>
          setProductCardexModal({ isOpen: false, productId: null })
        }
        isDarkMode={isDarkMode}
      />

      <SupplierCardexModal
        isOpen={supplierCardexModal.isOpen}
        supplierId={supplierCardexModal.supplierId}
        onClose={() =>
          setSupplierCardexModal({ isOpen: false, supplierId: null })
        }
        isDarkMode={isDarkMode}
      />

      <SupplierModal
        supplierModal={supplierModal}
        setSupplierModal={setSupplierModal}
        onSave={handleSaveSupplier}
        isDarkMode={isDarkMode}
      />

      <PaySupplierModal
        paySupplierModal={paySupplierModal}
        setPaySupplierModal={setPaySupplierModal}
        onPay={handlePaySupplier}
        isDarkMode={isDarkMode}
      />

      <PurchaseModal
        purchaseModal={purchaseModal}
        setPurchaseModal={setPurchaseModal}
        suppliers={suppliers}
        inventory={inventory}
        onSave={handleSavePurchase}
        isDarkMode={isDarkMode}
      />

      <SaleModal
        saleModal={saleModal}
        setSaleModal={setSaleModal}
        inventory={inventory}
        onSave={handleSaveSale}
        isDarkMode={isDarkMode}
      />

      {/* =====================================================================
          [SECTION 7] مودال‌های عملیاتی پیشخوان
      ===================================================================== */}
      {inProgressModal.isOpen && inProgressModal.repair && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className={`${
              isDarkMode
                ? "bg-slate-800 text-slate-100"
                : "bg-white text-slate-800"
            } rounded-xl shadow-2xl w-full max-w-md overflow-hidden`}
          >
            <div className="p-4 border-b bg-amber-50 dark:bg-amber-950/40 flex justify-between items-center text-amber-900 dark:text-amber-300">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4" /> شروع تعمیر و اعلام به مشتری
              </h3>
              <button
                onClick={() =>
                  setInProgressModal({ ...inProgressModal, isOpen: false })
                }
              >
                <X className="w-5 h-5 cursor-pointer" />
              </button>
            </div>
            <form onSubmit={handleConfirmInProgress} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">
                  تشخیص فنی خرابی (جهت نمایش به مشتری) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={inProgressModal.technicalIssue}
                  onChange={(e) =>
                    setInProgressModal({
                      ...inProgressModal,
                      technicalIssue: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-lg text-sm resize-none bg-transparent"
                  placeholder="مثال: تعویض آی‌سی تغذیه و رفع اتصالی مدار"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  زمان حدودی آماده شدن (از نظر تعمیرکار)
                </label>
                <input
                  type="text"
                  value={inProgressModal.estimatedReadyTime}
                  onChange={(e) =>
                    setInProgressModal({
                      ...inProgressModal,
                      estimatedReadyTime: e.target.value,
                    })
                  }
                  placeholder="مثال: فردا ظهر، تا ۲ ساعت دیگر، یا عصر امروز"
                  className="w-full p-2 border rounded-lg text-sm bg-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  هزینه برآوردشده (تومان) *
                </label>
                <input
                  required
                  type="number"
                  value={inProgressModal.estimatedCost}
                  onChange={(e) =>
                    setInProgressModal({
                      ...inProgressModal,
                      estimatedCost: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-lg text-sm font-mono dir-ltr text-right bg-transparent"
                  placeholder="1500000"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setInProgressModal({ ...inProgressModal, isOpen: false })
                  }
                  className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-royal-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  ثبت و تغییر به در حال تعمیر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {unrepairableModal.isOpen && unrepairableModal.repair && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className={`${
              isDarkMode
                ? "bg-slate-800 text-slate-100"
                : "bg-white text-slate-800"
            } rounded-xl shadow-2xl w-full max-w-md overflow-hidden`}
          >
            <div className="p-4 border-b bg-rose-50 dark:bg-rose-950/40 flex justify-between items-center text-rose-900 dark:text-rose-300">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" /> ثبت دستگاه غیرقابل تعمیر
              </h3>
              <button
                onClick={() =>
                  setUnrepairableModal({ ...unrepairableModal, isOpen: false })
                }
              >
                <X className="w-5 h-5 cursor-pointer" />
              </button>
            </div>
            <form
              onSubmit={handleConfirmUnrepairable}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium mb-1">
                  علت عدم امکان تعمیر (سوختگی سی‌پی‌یو، شکستگی برد و...) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={unrepairableModal.reason}
                  onChange={(e) =>
                    setUnrepairableModal({
                      ...unrepairableModal,
                      reason: e.target.value,
                    })
                  }
                  placeholder="توضیح دلایل فنی جهت اطلاع مشتری..."
                  className="w-full p-2 border rounded-lg text-sm resize-none bg-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setUnrepairableModal({
                      ...unrepairableModal,
                      isOpen: false,
                    })
                  }
                  className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  تایید عدم تعمیر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deliveryModal.isOpen && deliveryModal.repair && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className={`${
              isDarkMode
                ? "bg-slate-800 text-slate-100"
                : "bg-white text-slate-800"
            } rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]`}
          >
            <div className="p-4 border-b bg-blue-50 dark:bg-blue-950/40 flex justify-between items-center text-blue-900 dark:text-blue-300">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> تسویه و تحویل دستگاه به
                مشتری
              </h3>
              <button
                onClick={() =>
                  setDeliveryModal({ ...deliveryModal, isOpen: false })
                }
              >
                <X className="w-5 h-5 cursor-pointer" />
              </button>
            </div>

            <form
              onSubmit={handleConfirmDelivery}
              className="p-5 space-y-4 overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-medium mb-1">
                  شرح خدمات انجام‌شده *
                </label>
                <input
                  required
                  type="text"
                  value={deliveryModal.serviceDescription}
                  onChange={(e) =>
                    setDeliveryModal({
                      ...deliveryModal,
                      serviceDescription: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-lg text-sm bg-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    گارانتی ای‌پلاس
                  </label>
                  <select
                    value={deliveryModal.warrantyMonths}
                    onChange={(e) =>
                      setDeliveryModal({
                        ...deliveryModal,
                        warrantyMonths: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-slate-900"
                  >
                    <option value={0}>بدون گارانتی</option>
                    <option value={1}>۱ ماهه</option>
                    <option value={3}>۳ ماهه</option>
                    <option value={6}>۶ ماهه</option>
                    <option value={12}>۱۲ ماهه (یک سال)</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-xs font-medium mb-1">
                    جستجوی قطعه مصرفی از انبار (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={deliveryPartSearch}
                    onFocus={() => setShowDeliveryPartDropdown(true)}
                    onChange={(e) => {
                      setDeliveryPartSearch(e.target.value);
                      setShowDeliveryPartDropdown(true);
                      if (!e.target.value) {
                        setDeliveryModal({
                          ...deliveryModal,
                          inventoryItemId: "",
                        });
                      }
                    }}
                    placeholder="نام قطعه را جستجو کنید..."
                    className="w-full p-2 border rounded-lg text-sm bg-transparent"
                  />
                  {showDeliveryPartDropdown && (
                    <div className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                      <div
                        onClick={() => {
                          setDeliveryModal({
                            ...deliveryModal,
                            inventoryItemId: "",
                          });
                          setDeliveryPartSearch("");
                          setShowDeliveryPartDropdown(false);
                        }}
                        className="p-2 text-xs text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b"
                      >
                        بدون کسر از انبار
                      </div>
                      {filteredDeliveryParts.map((inv) => (
                        <div
                          key={inv.id}
                          onClick={() => {
                            setDeliveryModal({
                              ...deliveryModal,
                              inventoryItemId: inv.id,
                              partCost: String(inv.buyPrice || 0),
                            });
                            setDeliveryPartSearch(inv.name);
                            setShowDeliveryPartDropdown(false);
                          }}
                          className="p-2 text-xs hover:bg-royal-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between"
                        >
                          <span className="font-bold">{inv.name}</span>
                          <span className="font-mono text-slate-400">
                            موجودی: {inv.stock}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 border rounded-lg space-y-3 bg-slate-50 dark:bg-slate-900">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      هزینه قطعه (تومان)
                    </label>
                    <input
                      type="number"
                      value={deliveryModal.partCost}
                      onChange={(e) =>
                        setDeliveryModal({
                          ...deliveryModal,
                          partCost: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-lg text-sm font-mono dir-ltr text-right bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      هزینه پیک / ارسال (تومان)
                    </label>
                    <input
                      type="number"
                      value={deliveryModal.courierCost}
                      onChange={(e) =>
                        setDeliveryModal({
                          ...deliveryModal,
                          courierCost: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-lg text-sm font-mono dir-ltr text-right bg-transparent"
                    />
                  </div>
                </div>

                {deliveryModal.repair.walletBalance > 0 && (
                  <label className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryModal.useWallet}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const rec = Number(deliveryModal.receivedAmount) || 0;
                        const bal = deliveryModal.repair.walletBalance || 0;
                        setDeliveryModal({
                          ...deliveryModal,
                          useWallet: checked,
                          receivedAmount: checked
                            ? String(Math.max(0, rec - bal))
                            : String(rec + bal),
                        });
                      }}
                      className="rounded accent-emerald-600"
                    />
                    <span>
                      کسر اعتبار{" "}
                      {deliveryModal.repair.walletBalance.toLocaleString()}{" "}
                      تومانی کیف پول
                    </span>
                  </label>
                )}

                <div>
                  <label className="block text-xs font-medium mb-1">
                    مبلغ دریافتی نهایی از مشتری *
                  </label>
                  <input
                    required
                    type="number"
                    value={deliveryModal.receivedAmount}
                    onChange={(e) =>
                      setDeliveryModal({
                        ...deliveryModal,
                        receivedAmount: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-lg text-sm font-mono font-bold dir-ltr text-right bg-transparent"
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-bold pt-2 border-t">
                  <span>سود خالص این تعمیر:</span>
                  <span
                    className={
                      liveModalProfit >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }
                  >
                    {liveModalProfit.toLocaleString()} تومان
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setDeliveryModal({ ...deliveryModal, isOpen: false })
                  }
                  className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-royal-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  ثبت تحویل دستگاه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {customerProfileModal.isOpen && customerProfileModal.customer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className={`${
              isDarkMode
                ? "bg-slate-800 text-slate-100"
                : "bg-white text-slate-800"
            } rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]`}
          >
            <div className="p-4 border-b flex justify-between items-center bg-royal-50 dark:bg-slate-900">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-royal-900 dark:text-sky-400" />{" "}
                پرونده مشتری: {customerProfileModal.customer.name}
              </h3>
              <button
                onClick={() =>
                  setCustomerProfileModal({ isOpen: false, customer: null })
                }
              >
                <X className="w-5 h-5 cursor-pointer" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
                  <span className="text-slate-400">شماره موبایل:</span>
                  <div className="font-bold font-mono mt-1">
                    {customerProfileModal.customer.phone}
                  </div>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
                  <span className="text-slate-400">کد معرف اختصاصی:</span>
                  <div className="font-bold font-mono mt-1 text-royal-600 dark:text-sky-400">
                    {customerProfileModal.customer.referralCode}
                  </div>
                </div>
                <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
                  <span className="text-slate-400">موجودی کیف پول:</span>
                  <div className="font-bold mt-1 text-emerald-600">
                    {(
                      customerProfileModal.customer.walletBalance || 0
                    ).toLocaleString()}{" "}
                    تومان
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs mb-2">
                  تاریخچه تمام دستگاه‌های پذیرش‌شده این مشتری:
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                      <tr>
                        <th className="p-2.5">کد</th>
                        <th className="p-2.5">دستگاه</th>
                        <th className="p-2.5">شرح خدمات و نظر مشتری</th>
                        <th className="p-2.5 text-center">وضعیت</th>
                        <th className="p-2.5 text-center">امتیاز</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {repairs
                        .filter(
                          (r) =>
                            r.phone === customerProfileModal.customer.phone,
                        )
                        .map((cr) => (
                          <tr key={cr.id}>
                            <td className="p-2.5 font-mono">{cr.id}</td>
                            <td className="p-2.5 font-bold">{cr.device}</td>
                            <td className="p-2.5">
                              <div>{cr.serviceDescription || cr.issue}</div>
                              {cr.feedback && (
                                <div className="text-[11px] text-emerald-600 mt-0.5">
                                  نظر مشتری: «{cr.feedback}»
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              {STATUS_LABELS[cr.status] || cr.status}
                            </td>
                            <td className="p-2.5 text-center">
                              {cr.satisfaction ? (
                                <span className="text-amber-500 font-bold">
                                  {cr.satisfaction} / 5
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {itemModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className={`${
              isDarkMode
                ? "bg-slate-800 text-slate-100"
                : "bg-white text-slate-800"
            } rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4`}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm">
                {itemModal.id ? "ویرایش کالا" : "تعریف کالای جدید در انبار"}
              </h3>
              <button
                onClick={() => setItemModal({ ...itemModal, isOpen: false })}
              >
                <X className="w-5 h-5 cursor-pointer" />
              </button>
            </div>
            <form onSubmit={handleSaveInventory} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  نام کالا یا قطعه *
                </label>
                <input
                  required
                  type="text"
                  value={itemModal.name}
                  onChange={(e) =>
                    setItemModal({ ...itemModal, name: e.target.value })
                  }
                  placeholder="مثال: باتری آیفون 12 پرو اورجینال"
                  className="w-full p-2 border rounded-lg text-sm bg-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    موجودی اولیه
                  </label>
                  <input
                    type="number"
                    value={itemModal.stock}
                    onChange={(e) =>
                      setItemModal({ ...itemModal, stock: e.target.value })
                    }
                    placeholder="0"
                    className="w-full p-2 border rounded-lg text-sm font-mono dir-ltr text-right bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    حداقل موجودی (هشدار)
                  </label>
                  <input
                    type="number"
                    value={itemModal.minStock}
                    onChange={(e) =>
                      setItemModal({ ...itemModal, minStock: e.target.value })
                    }
                    placeholder="1"
                    className="w-full p-2 border rounded-lg text-sm font-mono dir-ltr text-right bg-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    قیمت خرید (تومان)
                  </label>
                  <input
                    type="number"
                    value={itemModal.buyPrice}
                    onChange={(e) =>
                      setItemModal({ ...itemModal, buyPrice: e.target.value })
                    }
                    placeholder="0"
                    className="w-full p-2 border rounded-lg text-sm font-mono dir-ltr text-right bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    قیمت فروش (تومان)
                  </label>
                  <input
                    type="number"
                    value={itemModal.sellPrice}
                    onChange={(e) =>
                      setItemModal({ ...itemModal, sellPrice: e.target.value })
                    }
                    placeholder="0"
                    className="w-full p-2 border rounded-lg text-sm font-mono dir-ltr text-right bg-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-royal-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                ذخیره کالا در انبار
              </button>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className={`${
              isDarkMode
                ? "bg-slate-800 text-slate-100"
                : "bg-white text-slate-800"
            } rounded-xl shadow-2xl w-full max-w-md overflow-hidden`}
          >
            <div className="flex justify-between items-center p-4 border-b bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-royal-600 dark:text-sky-400" />{" "}
                فرم پذیرش دستگاه جدید
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 cursor-pointer" />
              </button>
            </div>

            <form onSubmit={handleAddRepair} className="p-5 space-y-3 relative">
              <div className="relative">
                <label className="block text-xs font-medium mb-1">
                  شماره موبایل مشتری *
                </label>
                <input
                  required
                  type="tel"
                  value={newRepair.phone}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setNewRepair({ ...newRepair, phone: e.target.value });
                    setShowSuggestions(true);
                  }}
                  className="w-full p-2 border rounded-lg text-sm dir-ltr text-right bg-transparent"
                  placeholder="0912..."
                />

                {showSuggestions && matchingCustomers.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border rounded-lg shadow-lg max-h-36 overflow-y-auto">
                    {matchingCustomers.map((c) => (
                      <div
                        key={c.phone}
                        onClick={() => {
                          setNewRepair({
                            ...newRepair,
                            phone: c.phone,
                            name: c.name,
                          });
                          setShowSuggestions(false);
                        }}
                        className="p-2 text-xs hover:bg-royal-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between"
                      >
                        <span className="font-bold">{c.name}</span>
                        <span className="font-mono text-slate-400">
                          {c.phone}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  نام و نام خانوادگی *
                </label>
                <input
                  required
                  type="text"
                  value={newRepair.name}
                  onChange={(e) =>
                    setNewRepair({ ...newRepair, name: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg text-sm bg-transparent"
                  placeholder="مثال: رضا صادقی"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  مدل دستگاه *
                </label>
                <input
                  required
                  type="text"
                  value={newRepair.device}
                  onChange={(e) =>
                    setNewRepair({ ...newRepair, device: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg text-sm bg-transparent"
                  placeholder="مثال: سامسونگ A54"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  ایراد اعلامی *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newRepair.issue}
                  onChange={(e) =>
                    setNewRepair({ ...newRepair, issue: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg text-sm resize-none bg-transparent"
                  placeholder="توضیح خرابی..."
                />
              </div>

              {!selectedExistingCustomer && (
                <div>
                  <label className="block text-xs font-medium mb-1">
                    کد معرف (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={newRepair.referredByCode}
                    onChange={(e) =>
                      setNewRepair({
                        ...newRepair,
                        referredByCode: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-lg text-xs font-mono uppercase bg-transparent"
                    placeholder="AP-..."
                  />
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-royal-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  ثبت پذیرش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
