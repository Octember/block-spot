import { CustomizationOptions, SignupForm } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";

import "./overrides.css";

const AuthLayoutV2: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex min-h-full flex-col lg:flex-row pt-10 sm:px-6 lg:px-8 justify-center">
      <div className="flex flex-col gap-4 mt-12 md:max-w-lg mx-auto md:ml-auto mb-8">
        <h2 className="text-2xl font-bold">Welcome to BlockSpot! 🎉</h2>
        <h4 className="text-lg font-bold">
          Streamline your venue management—finally.
        </h4>
        <p className="prose">
          Get started in minutes and turn chaos into clarity. Book spaces,
          manage events, and optimize your venues with a tool designed for your
          hustle, not against it.
        </p>
        <p className="mt-4">
          <b>Join venue managers who rely on BlockSpot to:</b>
        </p>
        <ol className="list-disc list-inside">
          <li>Save hours on double-bookings and manual updates.</li>
          <li>Deliver seamless experiences for staff and clients.</li>
          <li>Focus on growth, not scheduling headaches.</li>
        </ol>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 mb-10 px-4 shadow-xl ring-1 ring-gray-900/10 sm:rounded-lg sm:px-10 dark:bg-white dark:text-gray-900 signupForm">
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
    colors: {
      brand: "#5969b8", // blue
      brandAccent: "#de5998", // pink
      submitButtonText: "white",
    },
  },
};

export function Signup() {
  return (
    <AuthLayoutV2>
      <SignupForm
        appearance={customizationOptions.appearance}
        additionalFields={[
          {
            name: "name",
            label: "Name",
            type: "input",
            validations: {
              required: "Name is required",
            },
          },
        ]}
      />
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
