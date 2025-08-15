import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
            Sign in to Dream Reader
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Access your AI conversations and chat history
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
