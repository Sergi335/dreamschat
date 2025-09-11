import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

export async function POST (req: Request) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      console.log('Nueva suscripción:', session)
      // 👉 Aquí guardas en tu DB que el usuario está suscrito
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Webhook error:', message)
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 })
  }
}
