'use client'

export default function ManageSubscriptionButton ({ customerId }: { customerId: string }) {
  const handleClick = async () => {
    const res = await fetch('/api/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId })
    })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-gray-700 text-white rounded-lg"
    >
      Gestionar suscripción
    </button>
  )
}
