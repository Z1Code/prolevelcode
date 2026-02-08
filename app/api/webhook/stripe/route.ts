import Stripe from "stripe";
import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe/client";
import { getResendClient } from "@/lib/email/resend";
import { courseAccessTemplate, coursePurchaseTemplate } from "@/lib/email/templates";

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, requireEnv("stripeWebhookSecret"));
  } catch (error) {
    return NextResponse.json({ error: "Invalid signature", details: error }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { error: eventInsertError } = await supabase.from("stripe_events").insert({
    event_id: event.id,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });

  if (eventInsertError?.code === "23505") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};

    const type = metadata.type;
    const userId = metadata.user_id;
    const courseId = metadata.course_id;
    const orderId = metadata.order_id;

    if (type === "course" && userId && courseId) {
      await supabase.from("enrollments").upsert(
        {
          user_id: userId,
          course_id: courseId,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
          amount_paid_cents: session.amount_total ?? 0,
          currency: (session.currency ?? "usd").toUpperCase(),
          status: "active",
        },
        { onConflict: "user_id,course_id" },
      );

      const { data: userRecord } = await supabase.from("users").select("email").eq("id", userId).maybeSingle();
      const { data: courseRecord } = await supabase.from("courses").select("title").eq("id", courseId).maybeSingle();

      const userEmail = typeof userRecord?.email === "string" ? userRecord.email : null;
      const courseTitle = typeof courseRecord?.title === "string" ? courseRecord.title : "Tu curso";

      if (userEmail) {
        const resend = getResendClient();
        const purchaseEmail = coursePurchaseTemplate({
          courseTitle,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cursos`,
        });
        const accessEmail = courseAccessTemplate({
          courseTitle,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cursos`,
        });

        await resend.emails.send({
          from: "ProLevelCode <no-reply@prolevelcode.dev>",
          to: userEmail,
          subject: purchaseEmail.subject,
          html: purchaseEmail.html,
        });

        await resend.emails.send({
          from: "ProLevelCode <no-reply@prolevelcode.dev>",
          to: userEmail,
          subject: accessEmail.subject,
          html: accessEmail.html,
        });
      }
    }

    if (type === "service" && orderId) {
      await supabase
        .from("service_orders")
        .update({
          status: "pending_kickoff",
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
          paid_amount_cents: session.amount_total ?? 0,
          paid_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await supabase.from("payment_transactions").insert({
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: paymentIntent.amount_received,
      currency: paymentIntent.currency.toUpperCase(),
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
    });
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;

    if (paymentIntentId) {
      await supabase.from("enrollments").update({ status: "refunded" }).eq("stripe_payment_intent_id", paymentIntentId);
      await supabase.from("service_orders").update({ status: "refunded" }).eq("stripe_payment_intent_id", paymentIntentId);
    }
  }

  return NextResponse.json({ received: true });
}
