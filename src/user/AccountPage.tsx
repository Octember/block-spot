import { Cog8ToothIcon } from "@heroicons/react/24/outline";
import { logout, useAuth } from "wasp/client/auth";
import {
  getCustomerPortalUrl,
  getUserOrganization,
  useQuery,
} from "wasp/client/operations";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { Button } from "../client/components/button";
import { SidebarLayout } from "../client/components/layouts/sidebar-layout";
import {
  type SubscriptionStatus,
  parsePaymentPlanId,
  prettyPaymentPlanName,
} from "../payment/plans";

export default function AccountPage() {
  const { data: user } = useAuth();
  const { data: organization, isLoading } = useQuery(getUserOrganization);

  console.log({ organization });

  if (!organization) return <div>No organization found.</div>;

  if (isLoading || !user) return <div>Loading...</div>;

  const userRole = organization?.users.find((u) => u.userId === user.id)?.role;

  return (
    <SidebarLayout
      header={{
        title: "Account Settings",
        description: "Manage your account settings and subscription.",
        actions: (
          <>
            <Button
              icon={<Cog8ToothIcon className="size-5" />}
              ariaLabel="Log out"
              variant="warning"
              onClick={logout}
            >
              Log out
            </Button>

            <WaspRouterLink to={routes.PasswordResetRoute.to}>
              <Button
                icon={<Cog8ToothIcon className="size-5" />}
                ariaLabel="Reset Password"
                variant="secondary"
              >
                Reset Password
              </Button>
            </WaspRouterLink>
          </>
        ),
      }}
    >
      <div className="">
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
                    organization.subscriptionStatus as SubscriptionStatus
                  }
                  subscriptionPlan={organization.subscriptionPlanId}
                  datePaid={organization.datePaid}
                />
              </div>
            </dl>
          </div>
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
    </SidebarLayout>
  );
}

type UserCurrentPaymentPlanProps = {
  subscriptionPlan: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  datePaid: Date | null;
};

function UserCurrentPaymentPlan({
  subscriptionPlan,
  subscriptionStatus,
  datePaid,
}: UserCurrentPaymentPlanProps) {

  console.log({ subscriptionStatus, subscriptionPlan, datePaid });
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
        <CustomerPortalButton />
      </>
    );
  }

  return (
    <>
      {/* <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400 sm:col-span-1 sm:mt-0">
        Credits remaining: {credits}
      </dd> */}
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
