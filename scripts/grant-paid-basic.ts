import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "luisjmolina29@gmail.com";

  // Upsert user
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      email_verified: true,
      auth_provider: "credentials",
    },
  });

  console.log("User:", user.id, user.email);

  // Check existing active tier
  const existing = await prisma.tierPurchase.findFirst({
    where: { user_id: user.id, tier: { in: ["basic", "pro"] }, status: "active" },
  });

  if (existing) {
    console.log("Already has active tier:", existing.tier);
    return;
  }

  // Create paid Basic tier (counted as revenue)
  const purchase = await prisma.tierPurchase.create({
    data: {
      user_id: user.id,
      tier: "basic",
      status: "active",
      payment_provider: "admin_grant",
      payment_reference: "Beca básica pagada — admin grant",
      amount_paid_cents: 2900, // $29 USD — counts as paid
      currency: "USD",
    },
  });

  console.log("Created TierPurchase:", purchase.id, "tier:", purchase.tier, "amount:", purchase.amount_paid_cents);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
