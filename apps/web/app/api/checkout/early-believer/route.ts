import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { creem } from "@/lib/creem";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "No email found" }, { status: 400 });
    }

    const { tier: rawTier, seats: rawSeats } = await request.json();

    const tier = Number(rawTier) === 1000 ? 1000 : 500;
    const seats = Math.max(1, Math.floor(Number(rawSeats) || 1));
    const discountPercent = tier === 1000 ? 10 : 5;
    const totalAmountUSD = tier * seats;
    const totalAmountInCents = totalAmountUSD * 100;

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/projects?early_believer=success`;

    // Dynamically create a Creem product based on the user's custom tier and seat selection
    const product = await creem.products.create({
      name: `Early Believer (${seats} ${seats === 1 ? "Seat" : "Seats"} @ $${tier}/seat)`,
      description: `Early Believer Plan: Prepayment for ${seats} seat(s) at $${tier} per seat. Entitles user to a ${discountPercent}% discount on future product bills.`,
      price: totalAmountInCents,
      currency: "USD",
      billingType: "onetime",
      taxMode: "exclusive",
      taxCategory: "saas",
    });

    // Create checkout session for the dynamically created product
    const checkout = await creem.checkouts.create({
      productId: product.id,
      successUrl,
      customer: {
        email,
      },
      metadata: {
        type: "early_believer",
        tier: String(tier),
        seats: String(seats),
        discountPercent: String(discountPercent),
        userId: user.id,
      },
    });

    return NextResponse.json({
      checkoutUrl: checkout.checkoutUrl,
      productId: product.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create checkout";
    console.error("Early Believer checkout creation error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
