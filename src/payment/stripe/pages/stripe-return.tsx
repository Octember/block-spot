import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../../client/components/card';
import { PageLayout } from '../../../client/components/layouts/page-layout';
import { useOrganization } from '../../../organization/hooks/use-organization';

export default function StripeReturnPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const navigate = useNavigate();
  const { accountId } = useParams();
  const { organization } = useOrganization();

  useEffect(() => {
    async function handleReturn() {
      try {

        if (organization?.stripeAccountId !== accountId) {
          throw new Error('Invalid Stripe account');
        }

        setStatus('success');

        // Redirect after a delay
        setTimeout(() => {
          navigate('/account');
        }, 3000);
      } catch (error) {
        console.error('Error handling Stripe return:', error);
        setStatus('error');
      }
    }

    handleReturn();
  }, [organization, accountId, navigate]);

  return (
    <PageLayout
      header={{
        title: 'Stripe Account Setup',
        description: 'Completing your Stripe account setup...'
      }}
    >
      <Card>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Setting up your Stripe account...</h2>
              <p className="text-gray-600">Please wait while we complete your account setup.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-semibold mb-2">Stripe Account Connected!</h2>
              <p className="text-gray-600">Your account has been successfully set up. Redirecting you to your account page...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-xl font-semibold mb-2">Setup Error</h2>
              <p className="text-gray-600 mb-4">There was an error setting up your Stripe account.</p>
              <button
                onClick={() => navigate('/account')}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
              >
                Return to Account
              </button>
            </>
          )}
        </div>
      </Card>
    </PageLayout>
  );
} 