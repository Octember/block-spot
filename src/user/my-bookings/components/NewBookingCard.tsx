import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { Button } from "../../../client/components/button";
import { Card } from "../../../client/components/card";

interface NewBookingCardProps {
  venueId?: string;
}

export const NewBookingCard = ({ venueId }: NewBookingCardProps) => {
  if (!venueId) return null;

  return (
    <div className="mt-8">
      <Card heading={{ title: "Book a New Space" }}>
        <div className="py-4">
          <p className="text-gray-600 mb-4">
            Ready to make a new booking? Check out available spaces at your organization&apos;s venues.
          </p>
          <WaspRouterLink
            to={routes.ScheduleRoute.to}
            params={{ venueId }}
          >
            <Button
              variant="primary"
              icon={<ArrowUpRightIcon className="size-5" />}
              ariaLabel="Navigate to scheduling page"
            >
              Schedule Now
            </Button>
          </WaspRouterLink>
        </div>
      </Card>
    </div>
  );
}; 