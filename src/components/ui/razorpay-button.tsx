import { useState } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/network/api';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
    interface Window {
        Razorpay: any;
    }
}

interface RazorpayButtonProps {
    planId: string; // e.g. "pro"
    currency?: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
    className?: string;
    children?: React.ReactNode;
}

export default function RazorpayButton({
    planId,
    currency = 'INR',
    onSuccess,
    onError,
    className,
    children = 'Upgrade Now'
}: RazorpayButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            // 1. Create Order (Server looks up price by planId)
            const order = await api.payments.createOrder({
                plan_id: planId,
                currency
            });

            // 2. Open Razorpay Checkout
            if (!window.Razorpay) {
                toast.error('Razorpay SDK failed to load');
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount, // Server returns correct amount
                currency: order.currency,
                name: "Scira Platform",
                description: `Subscription Upgrade (${planId.toUpperCase()})`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        // 3. Verify Payment
                        await api.payments.verify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        toast.success('Payment successful! Subscription updated.');
                        if (onSuccess) onSuccess();
                    } catch (verifyError) {
                        toast.error('Payment verification failed');
                        if (onError) onError(verifyError);
                    }
                },
                prefill: {
                    // We could pass user details here if available
                },
                theme: {
                    color: "#7C3AED" // Primary Color
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                toast.error('Payment failed: ' + response.error.description);
                if (onError) onError(response.error);
            });

            rzp1.open();

        } catch (error) {
            toast.error('Failed to initiate payment');
            console.error(error);
            if (onError) onError(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
            />
            <Button
                onClick={handlePayment}
                disabled={isLoading}
                className={className}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </Button>
        </>
    );
}

// Env var instruction: Ensure NEXT_PUBLIC_RAZORPAY_KEY_ID is set in .env
