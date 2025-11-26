import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BookManagement } from "./BookManagement";
import { CheckoutManagement } from "./CheckoutManagement";
import { CustomerManagement } from "./CustomerManagement";
import { FineManagement } from "./FineManagement";

type Tab = "books" | "checkouts" | "customers" | "fines";

export function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("books");
  const currentUser = useQuery(api.users.getCurrentUserProfile);

  const tabs = [
    { id: "books" as Tab, label: "Book Management", icon: "📚" },
    { id: "checkouts" as Tab, label: "Checkouts", icon: "📋" },
    { id: "customers" as Tab, label: "Customers", icon: "👥" },
    { id: "fines" as Tab, label: "Fines", icon: "💰" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Employee Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome, {currentUser?.profile?.firstName}! Manage the library system
        </p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-96">
        {activeTab === "books" && <BookManagement />}
        {activeTab === "checkouts" && <CheckoutManagement />}
        {activeTab === "customers" && <CustomerManagement />}
        {activeTab === "fines" && <FineManagement />}
      </div>
    </div>
  );
}
