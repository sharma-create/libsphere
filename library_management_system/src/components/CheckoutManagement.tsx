import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function CheckoutManagement() {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "overdue" | "returned">("all");
  
  const checkouts = useQuery(api.checkouts.getAllCheckouts, {
    status: statusFilter === "all" ? undefined : statusFilter as any,
  });
  
  const returnBook = useMutation(api.checkouts.returnBook);

  const handleReturn = async (checkoutId: Id<"checkouts">) => {
    try {
      await returnBook({ checkoutId });
      toast.success("Book returned successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to return book");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const isOverdue = (dueDate: number, status: string) => {
    return status === "active" && Date.now() > dueDate;
  };

  if (checkouts === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const activeCheckouts = checkouts.filter(c => c.status === "active");
  const overdueCheckouts = checkouts.filter(c => c.status === "active" && isOverdue(c.dueDate, c.status));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Checkout Management</h2>
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Checkouts</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{activeCheckouts.length}</div>
          <div className="text-sm text-blue-600">Active Checkouts</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{overdueCheckouts.length}</div>
          <div className="text-sm text-red-600">Overdue Books</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {checkouts.filter(c => c.status === "returned").length}
          </div>
          <div className="text-sm text-green-600">Returned Today</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book & Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {checkouts.map((checkout) => (
                <tr key={checkout._id} className={isOverdue(checkout.dueDate, checkout.status) ? "bg-red-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {checkout.book?.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        by {checkout.book?.author}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Customer: {checkout.user.name} ({checkout.user.email})
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Checked out: {formatDate(checkout.checkoutDate)}
                    </div>
                    <div className={`text-sm ${isOverdue(checkout.dueDate, checkout.status) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      Due: {formatDate(checkout.dueDate)}
                    </div>
                    {checkout.returnDate && (
                      <div className="text-sm text-green-600">
                        Returned: {formatDate(checkout.returnDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      checkout.status === "active"
                        ? isOverdue(checkout.dueDate, checkout.status)
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {checkout.status === "active" && isOverdue(checkout.dueDate, checkout.status)
                        ? "OVERDUE"
                        : checkout.status.toUpperCase()}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Renewals: {checkout.renewalCount}/2
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {checkout.status === "active" && (
                      <button
                        onClick={() => handleReturn(checkout._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Return Book
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {checkouts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No checkouts found.</p>
        </div>
      )}
    </div>
  );
}
