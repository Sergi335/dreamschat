import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

export async function POST (req: Request) {
  const body = await req.json()
  const prices = await stripe.prices.list({
    lookup_keys: [body.lookup_key],
    expand: ['data.product']
  })
  const session = await stripe.checkout.sessions.create({
    billing_address_collection: 'auto',
    line_items: [
      {
        price: prices.data[0].id,
        // For usage-based billing, don't pass quantity
        quantity: 1

      }
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/` // crear una que haga logout y borre la cuenta
  })
  console.log('🚀 ~ session:', session.url)

  return NextResponse.json({ url: session.url })
}
