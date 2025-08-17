'use client'
import { SignUp } from '@clerk/nextjs'
import { useParams } from 'next/navigation'

export default function Page () {
  const params = useParams()
  const locale = typeof params.locale === 'string' ? params.locale : Array.isArray(params.locale) ? params.locale[0] : 'es'
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Join Dream Reader and start chatting with AI models
          </p>
        </div>
        <SignUp
          signInUrl={`/${locale}/sign-in`}
          fallbackRedirectUrl={`/${locale}/dashboard`}
        />
      </div>
    </div>
  )
}
