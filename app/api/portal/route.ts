import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

export async function POST (req: Request) {
  try {
    const { customerId } = await req.json()

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Error creando sesión de portal:', error)
    return NextResponse.json(
      { error: 'No se pudo crear la sesión de portal' },
      { status: 500 }
    )
  }
}
