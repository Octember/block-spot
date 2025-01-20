import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { LoginForm } from "wasp/client/auth";
import { AuthPageLayout } from "./AuthPageLayout";
import { useLocation } from "react-router-dom";

export default function Login() {
  const location = useLocation();
  const emailVerified = Boolean(
    new URLSearchParams(location.search).get("emailVerified"),
  );

  return (
    <AuthPageLayout>
      {emailVerified && (
        <div className="bg-green-200 border-green-300 border-1 rounded-md p-4 mt-4">
          Email verified! Log in to continue.
        </div>
      )}

      <LoginForm />
      <br />
      <span className="text-sm font-medium text-gray-900 dark:text-gray-900">
        Don't have an account yet?{" "}
        <WaspRouterLink to={routes.SignupRoute.to} className="underline">
          go to signup
        </WaspRouterLink>
        .
      </span>
      <br />
      <span className="text-sm font-medium text-gray-900">
        Forgot your password?{" "}
        <WaspRouterLink
          to={routes.RequestPasswordResetRoute.to}
          className="underline"
        >
          reset it
        </WaspRouterLink>
        .
      </span>
    </AuthPageLayout>
  );
}
