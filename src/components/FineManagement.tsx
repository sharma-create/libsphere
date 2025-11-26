import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function FineManagement() {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all");
  
  const fines = useQuery(api.fines.getAllFines, {
    status: statusFilter === "all" ? undefined : statusFilter as any,
  });
  
  const payFine = useMutation(api.fines.payFine);

  const handlePayFine = async (fineId: Id<"fines">) => {
    try {
      await payFine({ fineId });
      toast.success("Fine marked as paid!");
    } catch (error: any) {
      toast.error(error.message || "Failed to process payment");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (fines === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const pendingFines = fines.filter(f => f.status === "pending");
  const totalPending = pendingFines.reduce((sum, fine) => sum + fine.amount, 0);
  const totalCollected = fines.filter(f => f.status === "paid").reduce((sum, fine) => sum + fine.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Fine Management</h2>
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Fines</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPending)}</div>
          <div className="text-sm text-red-600">Outstanding Fines</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{pendingFines.length}</div>
          <div className="text-sm text-orange-600">Pending Payments</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</div>
          <div className="text-sm text-green-600">Total Collected</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer & Book
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fine Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
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
              {fines.map((fine) => (
                <tr key={fine._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {fine.user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {fine.user.email}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Book: {fine.book?.title || "Unknown"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        {fine.reason}
                      </div>
                      <div className="text-sm text-gray-500">
                        Issued: {formatDate(fine.dateIssued)}
                      </div>
                      {fine.datePaid && (
                        <div className="text-sm text-green-600">
                          Paid: {formatDate(fine.datePaid)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(fine.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      fine.status === "pending"
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {fine.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {fine.status === "pending" && (
                      <button
                        onClick={() => handlePayFine(fine._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {fines.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No fines found.</p>
        </div>
      )}
    </div>
  );
}
