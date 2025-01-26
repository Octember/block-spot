import { FC } from "react";
import { useParams } from "react-router-dom";
import { api } from "wasp/client/api";
import { getVenueById, useQuery } from "wasp/client/operations";
import { Card } from "../../../client/components/card";
import { TextInput } from "../../../client/components/form/text-input";
import { SidebarLayout } from "../../../client/components/layouts/sidebar-layout";
import { useToast } from "../../../client/toast";


export const VenueIntegrationsPage: FC = () => {
  const toast = useToast();
  const { venueId } = useParams<{ venueId: string }>();

  if (!venueId) {
    return <div>Invalid venue ID</div>;
  }

  const { data: venue, isLoading } = useQuery(getVenueById, { venueId });

  if (isLoading || !venue) {
    return <div>Loading...</div>;
  }

  const url = `${api.getUri()}/calendar/export?venueId=${venueId}`;

  function copyToClipboard() {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied to clipboard",
      description: url,
    });
  }

  return (
    <SidebarLayout
      header={{
        title: "Integrations",
        description: "Connect your venue's schedule with external services",
      }}
    >
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Calendar Feed</h2>
            <p className="text-sm text-gray-600">
              Sync your blockspot bookings with your external calendars
            </p>
          </div>

          <div className="flex flex-col gap-2 max-w-xl">
            <label className="text-sm font-medium">iCal Link</label>
            <div className="flex items-center gap-2">
              <TextInput
                readOnly
                value={url}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                onClick={copyToClipboard}
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Use this link to sync with Google Calendar, Outlook, Apple Calendar or any other calendar app that supports iCal feeds
            </p>
          </div>
        </div>
      </Card>
    </SidebarLayout>
  );
};

export default VenueIntegrationsPage;