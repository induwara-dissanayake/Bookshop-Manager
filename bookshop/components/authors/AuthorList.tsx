'use client'

interface Author {
  id: number
  name: string
  email: string
  biography: string
  birthDate: string
  nationality: string
  _count?: {
    books: number
  }
}

interface AuthorListProps {
  authors: Author[]
  loading: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onEdit: (author: Author) => void
  onDelete: (id: number) => void
  onRefresh: () => void
}

export default function AuthorList({
  authors,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  onRefresh
}: AuthorListProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading authors...</p>
      </div>
    )
  }

  if (authors.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No authors found.</p>
        <button
          onClick={onRefresh}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Books
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {authors.map((author) => (
                <tr key={author.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {author.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {author._count?.books || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => onEdit(author)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                      aria-label="Edit author"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(author.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                      aria-label="Delete author"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page numbers */}
                {(() => {
                  const pages = []
                  const startPage = Math.max(1, currentPage - 2)
                  const endPage = Math.min(totalPages, startPage + 4)
                  
                  for (let page = startPage; page <= endPage; page++) {
                    pages.push(
                      <button
                        key={`page-${page}`}
                        onClick={() => onPageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${page === currentPage
                            ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                          }`}
                      >
                        {page}
                      </button>
                    )
                  }
                  return pages
                })()}

                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
