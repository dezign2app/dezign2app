'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

interface SubscribeButtonProps {
  productId: string;
}

export const SubscribeButton = ({ productId }: SubscribeButtonProps) => {
  const { isSignedIn, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  
  const handleCheckout = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const response = await fetch('/api/checkout/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
        }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please sign in to continue.');
          return;
        }
        throw new Error('Checkout failed');
      }

      const { checkoutUrl } = await response.json();
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const shouldAutoCheckout = searchParams.get('checkout') === 'true';
    if (isSignedIn && shouldAutoCheckout && !loading && !hasAutoTriggered) {
      setHasAutoTriggered(true);
      handleCheckout();
    }
  }, [isSignedIn, searchParams, loading, hasAutoTriggered]);
  
  const buttonStyle = `
    w-full mt-5 py-[13px] rounded-xl text-sm font-semibold transition-all duration-200
    bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed
  `;

  if (!isLoaded) {
    return (
      <button disabled className={buttonStyle}>
        Loading...
      </button>
    );
  }

  if (!isSignedIn) {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '/pricing';
    const redirectUrl = currentUrl.includes('?') 
      ? `${currentUrl}&checkout=true` 
      : `${currentUrl}?checkout=true`;

    return (
      <SignInButton mode="modal" forceRedirectUrl={redirectUrl}>
        <button className={buttonStyle} style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Get Started
        </button>
      </SignInButton>
    );
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={buttonStyle}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {loading ? 'Processing...' : 'Get Started'}
    </button>
  );
}