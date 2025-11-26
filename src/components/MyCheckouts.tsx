import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function MyCheckouts() {
  const checkouts = useQuery(api.checkouts.getUserCheckouts);
  const returnBook = useMutation(api.checkouts.returnBook);
  const renewBook = useMutation(api.checkouts.renewBook);

  const handleReturn = async (checkoutId: Id<"checkouts">) => {
    try {
      await returnBook({ checkoutId });
      toast.success("Book returned successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to return book");
    }
  };

  const handleRenew = async (checkoutId: Id<"checkouts">) => {
    try {
      await renewBook({ checkoutId });
      toast.success("Book renewed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to renew book");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const isOverdue = (dueDate: number) => {
    return Date.now() > dueDate;
  };

  if (checkouts === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (checkouts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No books checked out</h3>
        <p className="text-gray-500">Visit the catalog to check out some books!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Checked Out Books</h2>
      
      {checkouts.map((checkout) => (
        <div key={checkout._id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-xl">
                📖
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {checkout.book?.title}
                </h3>
                <p className="text-gray-600 mb-2">by {checkout.book?.author}</p>
                <div className="space-y-1 text-sm text-gray-500">
                  <p>Checked out: {formatDate(checkout.checkoutDate)}</p>
                  <p className={isOverdue(checkout.dueDate) ? "text-red-600 font-medium" : ""}>
                    Due: {formatDate(checkout.dueDate)}
                    {isOverdue(checkout.dueDate) && " (OVERDUE)"}
                  </p>
                  <p>Renewals: {checkout.renewalCount}/2</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleRenew(checkout._id)}
                disabled={checkout.renewalCount >= 2}
                className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Renew
              </button>
              <button
                onClick={() => handleReturn(checkout._id)}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
              >
                Return
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
