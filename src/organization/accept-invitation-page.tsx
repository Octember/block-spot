import { useEffect, useState } from "react";
import { useQuery } from "wasp/client/operations";
import { acceptInvitation } from "wasp/client/operations";
import { Link } from "wasp/client/router";
import { routes } from "wasp/client/router";
import { useSearchParams } from "react-router-dom";

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    const acceptInvite = async () => {
      if (!token) {
        setError("Invalid invitation link");
        return;
      }

      setIsAccepting(true);
      try {
        await acceptInvitation({ token });
        window.location.href = routes.AccountRoute.to; // Redirect to account page after accepting
      } catch (err: any) {
        setError(err.message || "Failed to accept invitation");
        setIsAccepting(false);
      }
    };

    acceptInvite();
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Invitation Error
            </h2>
            <div className="mt-4">
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
                {error}
              </div>
            </div>
            <div className="mt-4 text-center">
              <Link
                to={routes.AccountRoute.to}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Go to Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Accepting Invitation
          </h2>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
          <p className="mt-4 text-center text-gray-600">
            Please wait while we process your invitation...
          </p>
        </div>
      </div>
    </div>
  );
}
