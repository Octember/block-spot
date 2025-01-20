import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth, verifyEmail } from "wasp/client/auth";
import { acceptInvitation } from 'wasp/client/operations';
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { AuthPageLayout } from "../AuthPageLayout";

export function EmailVerificationPage() {
  const user = useAuth();
  return (
    <AuthPageLayout>
      <VerifyEmailForm />
      <br />
      <span className="text-sm text-gray-900">
        <WaspRouterLink to={routes.LoginRoute.to} className="underline">
          go to login
        </WaspRouterLink>
      </span>
    </AuthPageLayout>
  );
}

const VerifyEmailForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get("token");

  async function submitForm() {
    if (!token) {
      setErrorMessage({
        title:
          "The token is missing from the URL. Please check the link you received in your email.",
      });
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await verifyEmail({ token });

      setSuccessMessage("Your email has been verified. You can now log in.");
      navigate("/login?emailVerified=true");
    } catch (error: any) {
      setErrorMessage({
        title: error.message,
        description: error.data?.data?.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    submitForm();
  }, [location]);

  return (
    <div className="flex flex-col my-2 text-md">
      {isLoading && <div>Verifying email...</div>}
      {errorMessage && <div>{errorMessage.title}</div>}
      {successMessage && <div>{successMessage}</div>}
    </div>
  );
};
