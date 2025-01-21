import { CustomizationOptions, SignupForm } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";

const AuthLayoutV2: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex min-h-full flex-col lg:flex-row pt-10 sm:px-6 lg:px-8 justify-center">
      <div className="flex flex-col gap-4 md:max-w-md mx-auto lg:ml-auto mb-8">
        <h2 className="text-2xl font-bold">Start scheduling today</h2>
        <p>
          Welcome to BlockSpot! We're excited to help you streamline your venue scheduling and management. Create your account to start booking spaces, managing events, and making the most of your venues.
        </p>
        <p className="mt-4">
          Join thousands of venue managers who trust BlockSpot to handle their scheduling needs efficiently and professionally.
        </p>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 mb-10 px-4 shadow-xl ring-1 ring-gray-900/10 sm:rounded-lg sm:px-10 dark:bg-white dark:text-gray-900">
          {children}
        </div>
      </div>
    </div>
  );
};

const customizationOptions: CustomizationOptions = {
  appearance: {
    fontSizes: {
      sm: "14px",

    },
  },
};

export function Signup() {
  return (
    <AuthLayoutV2>
      <SignupForm appearance={customizationOptions.appearance} />
      <br />
      <span className="text-sm font-medium text-gray-900">
        I already have an account (
        <WaspRouterLink to={routes.LoginRoute.to} className="underline">
          go to login
        </WaspRouterLink>
        ).
      </span>
      <br />
    </AuthLayoutV2>
  );
}
