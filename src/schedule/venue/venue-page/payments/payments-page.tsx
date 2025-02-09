import { Card } from "../../../../client/components/card";
import { SidebarLayout } from "../../../../client/components/layouts/sidebar-layout";
import { useOrganization } from "../../../../organization/hooks/use-organization";
import { PaymentRules } from "../../../../payment/payments-form/payment-rules";
import { PaymentsForm } from "../../../../payment/payments-form/payments-form";

export const PaymentsPage = () => {
  const { isLoading: isOrganizationLoading, organization } = useOrganization();

  return (
    <SidebarLayout
      header={{
        title: "Restrictions",
        description: "Manage your venue restrictions",
      }}
    >
      {!organization ? (
        <div>Loading...</div>
      ) : (
        <Card
          heading={{
            title: "Payments",
            description: "Require payment for bookings",
          }}
        >
          <PaymentsForm organization={organization} />
        </Card>
      )}

      {organization?.stripeAccountId && <PaymentRules />}
    </SidebarLayout>
  );
};
