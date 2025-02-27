import { Card } from "../../client/components/card";
import { useAuthUser } from "../../auth/providers/AuthUserProvider";
import { getUserOrganizations, useQuery } from "wasp/client/operations";
import { ArrowUpRightIcon, Cog8ToothIcon } from "@heroicons/react/24/outline";
import { logout } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { Button } from "../../client/components/button";

export function AccountPage() {
  const { user } = useAuthUser();
  const { data: organizations } = useQuery(getUserOrganizations);

  return (
    <div className="centered-page-content">
      {organizations && organizations.length > 0 && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Congratulations, you can now schedule with {organizations[0].name}!
          </h1>
          <WaspRouterLink
            to={routes.ScheduleRoute.to}
            params={{ venueId: organizations[0].venues[0].id }}
          >
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowUpRightIcon className="size-5" />}
              ariaLabel="Navigate to scheduling page"
            >
              Start Scheduling Now
            </Button>
          </WaspRouterLink>
        </div>
      )}

      <Card heading={{ title: "Your Organizations" }}>
        {organizations?.map((organization) => (
          <div key={organization.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {organization?.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Role: {organization.users[0].role?.toLowerCase()}
                </p>
              </div>

              <div>
                <WaspRouterLink
                  to={routes.ScheduleRoute.to}
                  params={{ venueId: organization.venues[0].id }}
                  className="flex items-center -m-1.5 p-1.5 text-gray-900 duration-300 ease-in-out hover:text-yellow-500"
                >
                  <Button
                    variant="secondary"
                    ariaLabel="View Schedule"
                    icon={<ArrowUpRightIcon className="size-4" />}
                    onClick={() => {}}
                  >
                    View Schedule
                  </Button>
                </WaspRouterLink>
              </div>
            </div>
          </div>
        ))}
      </Card>

      <Card
        className="overflow-hidden"
        heading={{
          title: "Account Information",
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
        <div>
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
          </dl>
        </div>
      </Card>
    </div>
  );
}
