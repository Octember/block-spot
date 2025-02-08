import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createStripeAccountLink } from 'wasp/client/operations';
import { Card } from '../../../client/components/card';
import { PageLayout } from '../../../client/components/layouts/page-layout';

export default function StripeRefreshPage() {
  const navigate = useNavigate();
  const { accountId } = useParams();

  useEffect(() => {
    async function refreshStripeAccount() {
      try {
        // Get a new account link
        const accountLinkUrl = await createStripeAccountLink();

        // Redirect to the new Stripe onboarding URL
        window.location.href = accountLinkUrl;
      } catch (error) {
        console.error('Error refreshing Stripe account:', error);
        // On error, redirect to account page
        navigate('/account');
      }
    }

    refreshStripeAccount();
  }, [navigate]);

  return (
    <PageLayout
      header={{
        title: 'Refreshing Stripe Setup',
        description: 'Preparing to continue your Stripe account setup...'
      }}
    >
      <Card>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Refreshing Stripe Setup</h2>
          <p className="text-gray-600">Please wait while we redirect you to continue your Stripe account setup...</p>
        </div>
      </Card>
    </PageLayout>
  );
} 