'use client';

import { Suspense } from 'react';
import { signIn, getProviders } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Provider = {
  id: string;
  name: string;
  type: string;
};

function SignInContent() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [demoEmail, setDemoEmail] = useState('demo@receipts.ai');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  const handleDemoSignIn = async () => {
    setLoading(true);
    await signIn('demo', { email: demoEmail, callbackUrl });
  };

  return (
    <>
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error === 'OAuthSignin' && 'Error starting OAuth sign in.'}
          {error === 'OAuthCallback' && 'Error during OAuth callback.'}
          {error === 'OAuthCreateAccount' && 'Could not create OAuth account.'}
          {error === 'Callback' && 'Error in auth callback.'}
          {error === 'Default' && 'An error occurred during sign in.'}
          {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'Callback', 'Default'].includes(error) && error}
        </div>
      )}

      {/* Sign in card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        {/* OAuth Providers */}
        {providers && (
          <div className="space-y-3">
            {Object.values(providers)
              .filter((provider) => provider.id !== 'demo')
              .map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => signIn(provider.id, { callbackUrl })}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {provider.id === 'github' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  )}
                  {provider.id === 'google' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  <span className="font-medium text-gray-700">Continue with {provider.name}</span>
                </button>
              ))}
          </div>
        )}

        {/* Divider */}
        {providers && Object.keys(providers).length > 1 && (
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>
        )}

        {/* Demo Sign In */}
        <div className="space-y-3">
          <p className="text-sm text-gray-500 text-center">Try the demo without OAuth setup:</p>
          <input
            type="email"
            value={demoEmail}
            onChange={(e) => setDemoEmail(e.target.value)}
            placeholder="demo@receipts.ai"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Signing in...' : 'Sign in with Demo Account'}
          </button>
        </div>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl">🧾</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">RECEIPTS</span>
          </Link>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 rounded-lg"></div>
              <div className="h-12 bg-gray-200 rounded-lg"></div>
              <div className="h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        }>
          <SignInContent />
        </Suspense>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-primary-600 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
