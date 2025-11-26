import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function MyReservations() {
  const reservations = useQuery(api.reservations.getUserReservations);
  const cancelReservation = useMutation(api.reservations.cancelReservation);

  const handleCancel = async (reservationId: Id<"reservations">) => {
    try {
      await cancelReservation({ reservationId });
      toast.success("Reservation cancelled successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel reservation");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (reservations === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔖</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No active reservations</h3>
        <p className="text-gray-500">Reserve books that are currently unavailable to get notified when they become available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Reservations</h2>
      
      {reservations.map((reservation) => (
        <div key={reservation._id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-xl">
                📖
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {reservation.book?.title}
                </h3>
                <p className="text-gray-600 mb-2">by {reservation.book?.author}</p>
                <div className="space-y-1 text-sm text-gray-500">
                  <p>Reserved: {formatDate(reservation.reservationDate)}</p>
                  <p>Expires: {formatDate(reservation.expiryDate)}</p>
                  <p className="text-orange-600 font-medium">
                    Status: Waiting for availability
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleCancel(reservation._id)}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
