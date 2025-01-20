import React from "react";
import { useParams } from "react-router-dom";
import { Link } from "wasp/client/router";
import { routes } from "wasp/client/router";
import { useAuth } from "wasp/client/auth";
import { acceptInvitation, getInvitationDetails } from "wasp/client/operations";
import { SignupForm, FormInput } from "wasp/client/auth";
import { useQuery } from "wasp/client/operations";

type InvitationDetails = {
  organizationName: string;
  inviterName: string;
  role: string;
  email: string;
};

export function InvitationPage() {
  const { token } = useParams();
  const { data: user, isLoading: isAuthLoading } = useAuth();
  const {
    data: invitation,
    isLoading,
    error: queryError,
  } = useQuery(getInvitationDetails, { token: token || "" });
  const [error, setError] = React.useState<string | null>(
    queryError?.message || null,
  );

  // Handle logged-in user accepting invitation
  const handleAcceptInvitation = async () => {
    if (!token) return;
    try {
      await acceptInvitation({ token });
      window.location.href = routes.ScheduleRoute.to;
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation");
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-center text-red-600 mb-4">
            Error
          </h2>
          <p className="text-gray-600 text-center mb-6">
            {error || "Invalid invitation link"}
          </p>
          <div className="text-center">
            <Link
              to={routes.LandingPageRoute.to}
              className="text-indigo-600 hover:text-indigo-500"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  // If user is logged in
  if (user) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-center mb-6">
            Join {invitation.organizationName}
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            {invitation.inviterName} has invited you to join as a{" "}
            {invitation.role.toLowerCase()}.
          </p>
          {user.email === invitation.email ? (
            <button
              onClick={handleAcceptInvitation}
              className="w-full bg-indigo-600 text-white rounded-md py-2 px-4 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Accept Invitation
            </button>
          ) : (
            <div className="text-center text-red-600">
              <p>This invitation was sent to {invitation.email}.</p>
              <p className="mt-2">
                Please log in with that email address to accept the invitation.
              </p>
              <Link
                to={routes.LoginRoute.to}
                className="text-indigo-600 hover:text-indigo-500 block mt-4"
              >
                Switch Account
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If user is not logged in
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Join {invitation.organizationName}
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          {invitation.inviterName} has invited you to join as a{" "}
          {invitation.role.toLowerCase()}.
        </p>
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Already have an account?{" "}
              <Link
                to={routes.LoginRoute.to}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Log in
              </Link>
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create an Account
            </h3>
            <SignupForm
              additionalFields={[
                (form) => (
                  <FormInput
                    type="hidden"
                    {...form.register('invitationToken')}
                    value={token}
                  />
                )
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
