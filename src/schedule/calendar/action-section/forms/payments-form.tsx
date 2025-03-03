import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import React, { FC, useEffect, useMemo, useState } from "react";
import {
  useFormContext
} from "react-hook-form";
import { useParams } from "react-router-dom";
import {
  confirmPaidBooking,
  createConnectCheckoutSession,
  runPaymentRules,
  useQuery,
} from "wasp/client/operations";
import { Organization } from "wasp/entities";
import { LoadingSpinnerSmall } from "../../../../admin/layout/LoadingSpinner";
import { useAuthUser } from "../../../../auth/providers/AuthUserProvider";
import { getConnectedStripePromise } from "../../../../payment/stripe/stripe-react";
import { CreateReservationFormInputs } from '../modals/types';

export const useCheckoutSession = (spaceId: string) => {
  const { user } = useAuthUser();

  const [checkoutSession, setCheckoutSession] = useState<{
    clientSecret: string;
    checkoutSessionId: string;
  } | null>(null);
  const { setValue } = useFormContext<CreateReservationFormInputs>();

  useEffect(() => {
    createConnectCheckoutSession({
      userId: user?.id ?? "",
      spaceId: spaceId,
      startTime: new Date(),
      endTime: new Date(),
    }).then(({ clientSecret, checkoutSessionId }) => {
      setCheckoutSession({ clientSecret, checkoutSessionId });
    }).catch((error) => {
      console.error("Failed to create checkout session:", error);

      setValue("step", 'error',);
    });
  }, []);

  return {
    ...checkoutSession,
  };
};

export const PriceBreakdownDisplay: FC<{
  spaceId: string;
  venueId: string;
  startTime: Date;
  endTime: Date;
}> = ({ spaceId, venueId, startTime, endTime }) => {
  const { data: paymentInfo, isLoading } = useQuery(runPaymentRules, {
    spaceId,
    venueId,
    startTime,
    endTime,
  });

  if (isLoading) {
    return <LoadingSpinnerSmall />;
  }

  if (!paymentInfo?.requiresPayment || !paymentInfo?.priceBreakdown) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-700">No payment required for this reservation.</p>
      </div>
    );
  }

  const { priceBreakdown } = paymentInfo;

  return (
    <div className="border rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium mb-3">Price Breakdown</h3>

      <div className="space-y-2 mb-4">
        {priceBreakdown.baseRate && (
          <div className="flex justify-between items-center">
            <div className="text-gray-600">
              <span className="font-medium">{priceBreakdown.baseRate.description}</span>
            </div>
            <div className="font-medium">${priceBreakdown.baseRate.amount.toFixed(2)}</div>
          </div>
        )}

        {priceBreakdown.multipliers.length > 0 && (
          <>
            <div className="text-sm text-gray-500 mt-2">Multipliers</div>
            {priceBreakdown.multipliers.map((multiplier, index) => (
              <div key={index} className="flex justify-between items-center pl-4">
                <div className="text-gray-600">{multiplier.description}</div>
                <div>${multiplier.amount.toFixed(2)}</div>
              </div>
            ))}
          </>
        )}

        {priceBreakdown.fees.length > 0 && (
          <>
            <div className="text-sm text-gray-500 mt-2">Fees</div>
            {priceBreakdown.fees.map((fee, index) => (
              <div key={index} className="flex justify-between items-center pl-4">
                <div className="text-gray-600">{fee.description}</div>
                <div>${fee.amount.toFixed(2)}</div>
              </div>
            ))}
          </>
        )}

        {priceBreakdown.discounts.length > 0 && (
          <>
            <div className="text-sm text-gray-500 mt-2">Discounts</div>
            {priceBreakdown.discounts.map((discount, index) => (
              <div key={index} className="flex justify-between items-center pl-4">
                <div className="text-gray-600">{discount.description}</div>
                <div className="text-green-600">${Math.abs(discount.amount).toFixed(2)}</div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="border-t pt-3 mt-3">
        <div className="flex justify-between items-center font-medium">
          <div>Subtotal</div>
          <div>${priceBreakdown.subtotal.toFixed(2)}</div>
        </div>
        <div className="flex justify-between items-center font-bold text-lg mt-1">
          <div>Total</div>
          <div>${priceBreakdown.total.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export const StripeCheckoutForm = () => {
  return <EmbeddedCheckout />;
};

export const StripeWrapper: FC<{
  children: React.ReactNode;
  organization?: Organization;
  spaceId: string;
}> = ({ children, organization, spaceId }) => {
  const { venueId } = useParams<{ venueId: string }>();
  const [refundMessage, setRefundMessage] = useState<string | null>();
  const { clientSecret, checkoutSessionId } = useCheckoutSession(spaceId);

  const stripePromise = useMemo(() => {
    if (!organization?.stripeAccountId) {
      return undefined;
    }
    return getConnectedStripePromise(organization.stripeAccountId);
  }, [organization?.stripeAccountId]);

  if (!clientSecret || !stripePromise) {
    console.warn("no client secret or stripe promise");
    return <LoadingSpinnerSmall />;
  }

  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{
        clientSecret,
        onComplete: async () => {
          console.log("onComplete", checkoutSessionId);
          if (!checkoutSessionId) {
            console.error("No checkout session ID");
            return;
          }

          try {
            await confirmPaidBooking({
              checkoutSessionId,
              venueId: venueId ?? "",
            });
            console.log("Payment confirmed!");
          } catch (error: any) {
            if (error?.message?.includes("Refund issued")) {
              setRefundMessage(
                "Sorry, the slot was taken before your payment completed. You have been refunded.",
              );
            } else {
              console.error("Failed to confirm payment:", error);
            }
          }
        },
      }}
    >
      {children}
      {refundMessage && (
        <p className="text-red-500 text-xl font-bold mt-4">{refundMessage}</p>
      )}
    </EmbeddedCheckoutProvider>
  );
};
