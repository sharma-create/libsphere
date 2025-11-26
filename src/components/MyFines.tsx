import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function MyFines() {
  const fines = useQuery(api.fines.getUserFines);

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

  const pendingFines = fines.filter(fine => fine.status === "pending");
  const paidFines = fines.filter(fine => fine.status === "paid");
  const totalPending = pendingFines.reduce((sum, fine) => sum + fine.amount, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Fine Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPending)}</div>
            <div className="text-sm text-red-600">Outstanding Balance</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{pendingFines.length}</div>
            <div className="text-sm text-orange-600">Pending Fines</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{paidFines.length}</div>
            <div className="text-sm text-green-600">Paid Fines</div>
          </div>
        </div>
      </div>

      {pendingFines.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Outstanding Fines</h3>
          <div className="space-y-4">
            {pendingFines.map((fine) => (
              <div key={fine._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900">
                      {fine.book?.title || "Unknown Book"}
                    </h4>
                    <p className="text-gray-600 mb-2">{fine.reason}</p>
                    <div className="space-y-1 text-sm text-gray-500">
                      <p>Issued: {formatDate(fine.dateIssued)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(fine.amount)}
                    </div>
                    <div className="text-sm text-red-600">PENDING</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              <strong>Note:</strong> Please visit the library to pay your outstanding fines. 
              You may not be able to check out new books until all fines are paid.
            </p>
          </div>
        </div>
      )}

      {paidFines.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h3>
          <div className="space-y-4">
            {paidFines.map((fine) => (
              <div key={fine._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900">
                      {fine.book?.title || "Unknown Book"}
                    </h4>
                    <p className="text-gray-600 mb-2">{fine.reason}</p>
                    <div className="space-y-1 text-sm text-gray-500">
                      <p>Issued: {formatDate(fine.dateIssued)}</p>
                      <p>Paid: {fine.datePaid ? formatDate(fine.datePaid) : "N/A"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(fine.amount)}
                    </div>
                    <div className="text-sm text-green-600">PAID</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fines.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No fines</h3>
          <p className="text-gray-500">Great job! You have no outstanding fines.</p>
        </div>
      )}
    </div>
  );
}
