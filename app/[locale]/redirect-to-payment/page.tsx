'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RedirectToPayment () {
  const router = useRouter()
  //   const params = useParams()
  useEffect(() => {
    async function goToPayment () {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId: '123' }),
        headers: { 'Content-Type': 'application/json' }
      })
      const { url } = await res.json()
      if (url) {
        router.replace(url)
      }
    }
    goToPayment()
  }, [router])
  return <div>Redirigiendo a la pasarela de pago...</div>
}
