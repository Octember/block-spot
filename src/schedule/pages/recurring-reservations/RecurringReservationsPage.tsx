import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecurringReservations, useQuery } from 'wasp/client/operations';
import { SidebarLayout } from '../../../client/components/layouts/sidebar-layout';
import { format } from 'date-fns';
import {
  CancelRecurringReservationButton,
  CancelSingleOccurrenceButton
} from '../../components/recurring-reservations/CancelRecurringReservation';

type FilterOptions = {
  venueId?: string;
  spaceId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'ACTIVE' | 'CANCELLED' | 'ALL';
};

const RecurringReservationsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'ACTIVE'
  });

  const { data, isLoading, error, refetch } = useQuery(getRecurringReservations, {
    ...filters,
    page,
    limit
  });

  const recurringReservations = data?.data || [];
  const pagination = data?.pagination;

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return String(error || 'Unknown error');
  };

  const handleCancelSuccess = () => {
    refetch();
  };

  const handleCancelError = (error: Error) => {
    alert(`Error canceling reservation: ${error.message}`);
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <SidebarLayout
      header={{
        title: "Recurring Reservations",
        description: "Manage your recurring reservation series"
      }}
    >
      {/* Filter Controls */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filters.status || 'ALL'}
              onChange={(e) => handleFilterChange({ status: e.target.value as 'ACTIVE' | 'CANCELLED' | 'ALL' })}
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              id="startDate"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange({ startDate: e.target.value || undefined })}
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              id="endDate"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange({ endDate: e.target.value || undefined })}
            />
          </div>

          <div className="flex items-end">
            <button
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded"
              onClick={() => {
                setFilters({ status: 'ACTIVE' });
                setPage(1);
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-gray-600">Loading reservations...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error loading reservations: {getErrorMessage(error)}
              </p>
            </div>
          </div>
        </div>
      ) : !recurringReservations || recurringReservations.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
          <p className="text-gray-500 mb-4">No recurring reservations found.</p>
          <Link
            to="/schedule"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create a Reservation
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Your Recurring Reservations</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your recurring reservation series.</p>
            </div>
            <ul className="divide-y divide-gray-200">
              {recurringReservations.map((reservation) => (
                <li key={reservation.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h4 className="text-lg font-medium text-gray-900">
                        {reservation.space.name} at {reservation.space.venue.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {format(new Date(reservation.startTime), 'PPp')} - {format(new Date(reservation.endTime), 'p')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Every {reservation.interval} {reservation.frequency.toLowerCase()}
                        {reservation.description && ` - ${reservation.description}`}
                      </p>
                      <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full w-fit ${reservation.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                        }`}>
                        {reservation.status}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {reservation.status === 'ACTIVE' && (
                        <>
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={() => {
                              // Will implement update functionality later
                              console.log('Update', reservation.id);
                            }}
                          >
                            Update
                          </button>
                          <CancelRecurringReservationButton
                            recurringReservationId={reservation.id}
                            onSuccess={handleCancelSuccess}
                            onError={handleCancelError}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  {reservation.reservations.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700">Upcoming Occurrences:</h5>
                      <ul className="mt-1 space-y-1">
                        {reservation.reservations.map((occurrence) => (
                          <li key={occurrence.id} className="text-sm text-gray-500 flex justify-between items-center">
                            <span>{format(new Date(occurrence.startTime), 'PPp')}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${occurrence.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                occurrence.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                {occurrence.status}
                              </span>
                              {occurrence.status === 'CONFIRMED' && reservation.status === 'ACTIVE' && (
                                <CancelSingleOccurrenceButton
                                  recurringReservationId={reservation.id}
                                  reservationId={occurrence.id}
                                  onSuccess={handleCancelSuccess}
                                  onError={handleCancelError}
                                />
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.totalPages}
                  className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(page * limit, pagination.totalItems)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${pageNum === page
                          ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                          }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === pagination.totalPages}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </SidebarLayout>
  );
};

export default RecurringReservationsPage; 