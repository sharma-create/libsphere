import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BookCatalog } from "./BookCatalog";
import { MyCheckouts } from "./MyCheckouts";
import { MyReservations } from "./MyReservations";
import { MyFines } from "./MyFines";

type Tab = "catalog" | "checkouts" | "reservations" | "fines";

export function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("catalog");
  const currentUser = useQuery(api.users.getCurrentUserProfile);

  const tabs = [
    { id: "catalog" as Tab, label: "Book Catalog", icon: "📚" },
    { id: "checkouts" as Tab, label: "My Books", icon: "📖" },
    { id: "reservations" as Tab, label: "Reservations", icon: "🔖" },
    { id: "fines" as Tab, label: "Fines", icon: "💰" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {currentUser?.profile?.firstName}!
        </h1>
        <p className="text-gray-600">Explore our collection and manage your library account</p>
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
        {activeTab === "catalog" && <BookCatalog />}
        {activeTab === "checkouts" && <MyCheckouts />}
        {activeTab === "reservations" && <MyReservations />}
        {activeTab === "fines" && <MyFines />}
      </div>
    </div>
  );
}
