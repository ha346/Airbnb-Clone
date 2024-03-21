import Stripe from "stripe"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

import prismadb from "../../libs/prismadb"
import { stripe } from "../../libs/stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session

  if (event.type === "checkout.session.completed") {
    // const subscription = await stripe.subscriptions.retrieve(
    //   session.subscription as string
    // )

    const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
      (event.data.object as any).id,
      {
        expand: ["line_items"],
      }
    );

    const lineItems = sessionWithLineItems.line_items;
    const subscription = lineItems?.data[0];


    if (!session?.metadata?.userId) {
      return new NextResponse("User id is required", { status: 400 });
    }

    await prismadb.userSubscription.create({
      data: {
        userId: session?.metadata?.userId, 
        stripeCustomerId: subscription?.id as string,
        stripePriceId: subscription?.price?.id,
      },
    })

    // console.log("Line Items data: ", lineItems?.data[0]);

  }

  return new NextResponse(null, { status: 200 })
};
