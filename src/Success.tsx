import { useEffect, useState } from 'react';

export default function Success() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = urlParams.get('session_id');
    setSessionId(sessionIdFromUrl);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your order. Your custom STASHBOX lid is being prepared for production.
        </p>
        
        {sessionId && (
          <p className="text-xs text-gray-500 mb-6">
            Order ID: {sessionId}
          </p>
        )}
        
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• You'll receive an order confirmation email shortly</li>
              <li>• We'll start 3D printing your custom lid</li>
              <li>• Your order will ship within 3-5 business days</li>
              <li>• Tracking information will be provided</li>
            </ul>
          </div>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-900 text-white rounded-xl px-6 py-3 font-semibold hover:bg-gray-800"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}