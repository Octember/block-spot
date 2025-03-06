import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, getRecurringReservations } from 'wasp/client/operations';
import { SidebarLayout } from '../../../client/components/layouts/sidebar-layout';
import { format } from 'date-fns';

const RecurringReservationsPage: React.FC = () => {
  const { data: recurringReservations, isLoading, error } = useQuery(getRecurringReservations);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return String(error || 'Unknown error');
  };

  return (
    <SidebarLayout
      header={{
        title: "Recurring Reservations",
        description: "Manage your recurring reservation series"
      }}
    >
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
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => {
                        // Will implement update functionality later
                        console.log('Update', reservation.id);
                      }}
                    >
                      Update
                    </button>
                    <button
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={() => {
                        // Will implement cancel functionality later
                        console.log('Cancel', reservation.id);
                      }}
                    >
                      Cancel Series
                    </button>
                  </div>
                </div>
                {reservation.reservations.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-700">Upcoming Occurrences:</h5>
                    <ul className="mt-1 space-y-1">
                      {reservation.reservations.map((occurrence) => (
                        <li key={occurrence.id} className="text-sm text-gray-500 flex justify-between">
                          <span>{format(new Date(occurrence.startTime), 'PPp')}</span>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${occurrence.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            occurrence.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {occurrence.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </SidebarLayout>
  );
};

export default RecurringReservationsPage; 