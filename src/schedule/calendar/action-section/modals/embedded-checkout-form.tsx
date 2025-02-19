import { FC, FormEvent } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

export const EmbeddedCheckoutForm: FC<{
  onSuccess: () => void;
}> = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/schedule/success",
      },
    });

    if (error) {
      console.error("[error]", error);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
      >
        Pay now
      </button>
    </form>
  );
};
