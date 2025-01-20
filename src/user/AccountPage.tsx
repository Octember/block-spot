import type { User } from "wasp/entities";
import {
  type SubscriptionStatus,
  prettyPaymentPlanName,
  parsePaymentPlanId,
} from "../payment/plans";
import { getCustomerPortalUrl, useQuery } from "wasp/client/operations";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { logout, useAuth } from "wasp/client/auth";
import { OrganizationSection } from "../organization/OrganizationPage";
import { getUserOrganization } from "wasp/client/operations";

export default function AccountPage() {
  const { data: user } = useAuth();
  const { data: organization, isLoading } = useQuery(getUserOrganization);

  if (isLoading || !user) return <div>Loading...</div>;

  const userRole = organization?.users.find(
    (u) => u.userId === user.id,
  )?.role;

  return (
    <div className="min-h-screen">
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">
            Account Settings
          </h1>

          <div className="mt-8">
            <OrganizationSection />
          </div>

          <div className="mt-10">
            <div className="overflow-hidden border border-gray-900/10 shadow-lg sm:rounded-lg mb-4 dark:border-gray-100/10 bg-white">
              <div className="px-4 py-5 sm:px-6 lg:px-8">
                <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                  Account Information
                </h3>
              </div>
              <div className="border-t border-gray-900/10 dark:border-gray-100/10 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-900/10 sm:dark:divide-gray-100/10">
                  {!!user?.email && (
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500 dark:text-white">
                        Email address
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400 sm:col-span-2 sm:mt-0">
                        {user.email}
                      </dd>
                    </div>
                  )}
                  {!!user?.username && (
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500 dark:text-white">
                        Username
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400 sm:col-span-2 sm:mt-0">
                        {user.username}
                      </dd>
                    </div>
                  )}
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 dark:text-white">
                      Your Plan
                    </dt>
                    <UserCurrentPaymentPlan
                      subscriptionStatus={
                        user.subscriptionStatus as SubscriptionStatus
                      }
                      subscriptionPlan={user.subscriptionPlan}
                      datePaid={user.datePaid}
                      credits={user.credits}
                    />
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 dark:text-white">
                      About
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400 sm:col-span-2 sm:mt-0">
                      I'm a cool customer.
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="inline-flex w-full justify-end">
              <button
                onClick={logout}
                className="inline-flex justify-center mx-8 py-2 px-4 border border-transparent shadow-md text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                logout
              </button>
            </div>
          </div>

          {/* Organizations */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">
              Your Organizations
            </h2>

            <div key={organization?.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {organization?.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Role: {userRole?.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type UserCurrentPaymentPlanProps = {
  subscriptionPlan: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  datePaid: Date | null;
  credits: number;
};

function UserCurrentPaymentPlan({
  subscriptionPlan,
  subscriptionStatus,
  datePaid,
  credits,
}: UserCurrentPaymentPlanProps) {
  if (subscriptionStatus && subscriptionPlan && datePaid) {
    return (
      <>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400 sm:col-span-1 sm:mt-0">
          {getUserSubscriptionStatusDescription({
            subscriptionPlan,
            subscriptionStatus,
            datePaid,
          })}
        </dd>
        {subscriptionStatus !== "deleted" ? (
          <CustomerPortalButton />
        ) : (
          <BuyMoreButton />
        )}
      </>
    );
  }

  return (
    <>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400 sm:col-span-1 sm:mt-0">
        Credits remaining: {credits}
      </dd>
      <BuyMoreButton />
    </>
  );
}

function getUserSubscriptionStatusDescription({
  subscriptionPlan,
  subscriptionStatus,
  datePaid,
}: {
  subscriptionPlan: string;
  subscriptionStatus: SubscriptionStatus;
  datePaid: Date;
}) {
  const planName = prettyPaymentPlanName(parsePaymentPlanId(subscriptionPlan));
  const endOfBillingPeriod = prettyPrintEndOfBillingPeriod(datePaid);
  return prettyPrintStatus(planName, subscriptionStatus, endOfBillingPeriod);
}

function prettyPrintStatus(
  planName: string,
  subscriptionStatus: SubscriptionStatus,
  endOfBillingPeriod: string,
): string {
  const statusToMessage: Record<SubscriptionStatus, string> = {
    active: `${planName}`,
    past_due: `Payment for your ${planName} plan is past due! Please update your subscription payment information.`,
    cancel_at_period_end: `Your ${planName} plan subscription has been canceled, but remains active until the end of the current billing period${endOfBillingPeriod}`,
    deleted: `Your previous subscription has been canceled and is no longer active.`,
  };
  if (Object.keys(statusToMessage).includes(subscriptionStatus)) {
    return statusToMessage[subscriptionStatus];
  } else {
    throw new Error(`Invalid subscriptionStatus: ${subscriptionStatus}`);
  }
}

function prettyPrintEndOfBillingPeriod(date: Date) {
  const oneMonthFromNow = new Date(date);
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  return ": " + oneMonthFromNow.toLocaleDateString();
}

function BuyMoreButton() {
  return (
    <div className="ml-4 flex-shrink-0 sm:col-span-1 sm:mt-0">
      <WaspRouterLink
        to={routes.PricingPageRoute.to}
        className="font-medium text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
      >
        Buy More/Upgrade
      </WaspRouterLink>
    </div>
  );
}

function CustomerPortalButton() {
  const {
    data: customerPortalUrl,
    isLoading: isCustomerPortalUrlLoading,
    error: customerPortalUrlError,
  } = useQuery(getCustomerPortalUrl);

  const handleClick = () => {
    if (customerPortalUrlError) {
      console.error("Error fetching customer portal url");
    }

    if (customerPortalUrl) {
      window.open(customerPortalUrl, "_blank");
    } else {
      console.error("Customer portal URL is not available");
    }
  };

  return (
    <div className="ml-4 flex-shrink-0 sm:col-span-1 sm:mt-0">
      <button
        onClick={handleClick}
        disabled={isCustomerPortalUrlLoading}
        className="font-medium text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
      >
        Manage Subscription
      </button>
    </div>
  );
}
