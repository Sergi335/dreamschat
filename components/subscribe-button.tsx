'use client'
import { useState } from 'react'

export default function SubscribeButton ({ priceId }: { priceId: string }) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
      headers: { 'Content-Type': 'application/json' }
    })
    const { url } = await res.json()
    window.location.href = url // redirige al Checkout de Stripe
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
    >
      {loading ? 'Redirigiendo...' : 'Suscribirse'}
    </button>
  )
}
