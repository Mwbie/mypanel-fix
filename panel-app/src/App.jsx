import { useState } from "react";
import MobileRepairDashboard from "./dashboard";
import LoginPage from "./Login";
import CustomerPanel from "./CustomerPanel";

function App() {
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("aplus_role") || null;
  });

  const [customerData, setCustomerData] = useState(() => {
    const saved = localStorage.getItem("aplus_customer");
    return saved ? JSON.parse(saved) : null;
  });

  // ذخیره اطلاعات تکمیلی مدیر یا پرسنل (نام و سطح دسترسی‌ها)
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem("aplus_userdata");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (role, data, extraInfo) => {
    setUserRole(role);
    localStorage.setItem("aplus_role", role);

    if (role === "customer" && data) {
      setCustomerData(data);
      localStorage.setItem("aplus_customer", JSON.stringify(data));
    } else if (role === "admin" || role === "staff") {
      // پشتیبانی از هر دو حالت ارسال دیتا از صفحه لاگین
      const staffInfo = extraInfo ||
        data || {
          name: role === "admin" ? "مدیر کل سیستم" : "پرسنل ای‌پلاس",
          permissions:
            role === "admin"
              ? ["dashboard", "accounting", "sms", "settings"]
              : ["dashboard"],
        };
      setUserData(staffInfo);
      localStorage.setItem("aplus_userdata", JSON.stringify(staffInfo));
    }
  };

  // بروزرسانی لحظه‌ای اطلاعات مشتری پس از تایید هزینه یا ثبت رضایت‌سنجی
  const handleRefreshCustomerData = async () => {
    if (!customerData?.phone) return;
    try {
      const res = await fetch(`/api/customer-profile/${customerData.phone}`);
      if (res.ok) {
        const profile = await res.json();
        setCustomerData(profile);
        localStorage.setItem("aplus_customer", JSON.stringify(profile));
      }
    } catch (err) {
      console.error("خطا در بروزرسانی اطلاعات مشتری:", err);
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setCustomerData(null);
    setUserData(null);
    localStorage.removeItem("aplus_role");
    localStorage.removeItem("aplus_customer");
    localStorage.removeItem("aplus_userdata");
    localStorage.removeItem("aplus_token");
  };

  if (!userRole) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // ورود مدیر کل یا پرسنل به داشبورد تعمیرات همراه با سطح دسترسی
  if (userRole === "admin" || userRole === "staff") {
    return (
      <MobileRepairDashboard
        userRole={userRole}
        userData={userData}
        onLogout={handleLogout}
      />
    );
  }

  if (userRole === "customer") {
    return (
      <CustomerPanel
        customerData={customerData}
        onLogout={handleLogout}
        onRefreshData={handleRefreshCustomerData}
      />
    );
  }

  return null;
}

export default App;
