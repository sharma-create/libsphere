import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function BookCatalog() {
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  
  const books = useQuery(api.books.getAllBooks, {
    search: search || undefined,
    genre: selectedGenre || undefined,
    limit: 50,
  });
  const genres = useQuery(api.books.getGenres);
  
  const checkoutBook = useMutation(api.checkouts.checkoutBook);
  const reserveBook = useMutation(api.reservations.reserveBook);

  const handleCheckout = async (bookId: Id<"books">) => {
    try {
      await checkoutBook({ bookId });
      toast.success("Book checked out successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to checkout book");
    }
  };

  const handleReserve = async (bookId: Id<"books">) => {
    try {
      await reserveBook({ bookId });
      toast.success("Book reserved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to reserve book");
    }
  };

  if (books === undefined || genres === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search books by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <div key={book._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center text-2xl">
                📖
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {book.title}
                </h3>
                <p className="text-gray-600 mb-2">by {book.author}</p>
                <p className="text-sm text-gray-500 mb-2">{book.genre}</p>
                <p className="text-sm text-gray-500 mb-3">
                  Published: {book.publishedYear}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">
                    Available: {book.availableCopies}/{book.totalCopies}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    book.availableCopies > 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {book.availableCopies > 0 ? "Available" : "Unavailable"}
                  </span>
                </div>

                <div className="flex gap-2">
                  {book.availableCopies > 0 ? (
                    <button
                      onClick={() => handleCheckout(book._id)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-700"
                    >
                      Checkout
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReserve(book._id)}
                      className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md text-sm hover:bg-orange-700"
                    >
                      Reserve
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {book.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">{book.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {books.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No books found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
