import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { Role, TaskType, Priority, TaskStatus, Platform, AdStatus, Tier } from "../src/generated/prisma/enums";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL (ou DIRECT_URL) not set in .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// UUID fixo de um usuário "sistema" só para servir como requestedBy das tasks
// de demonstração. Não corresponde a nenhum auth.users — não é login real.
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  console.log("Seeding…");

  // O primeiro usuário real é criado automaticamente no bootstrap do login
  // (ver src/lib/session.ts). Aqui só criamos o "sistema" placeholder.
  const demoUser = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: { id: DEMO_USER_ID, email: "sistema@dash.local", name: "Sistema (demo)", role: Role.ADMIN },
  });
  console.log(`demo user: ${demoUser.email}`);

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: "BRC-001" },
      update: {},
      create: { sku: "BRC-001", name: "Brinco Solitário Ouro", margin: "0.55", priorityTier: Tier.A },
    }),
    prisma.product.upsert({
      where: { sku: "CLR-014" },
      update: {},
      create: { sku: "CLR-014", name: "Colar Coração Pequeno", margin: "0.42", priorityTier: Tier.B },
    }),
    prisma.product.upsert({
      where: { sku: "ANE-022" },
      update: {},
      create: { sku: "ANE-022", name: "Anel Aliança Lisa", margin: "0.38", priorityTier: Tier.C },
    }),
  ]);
  console.log(`products: ${products.length}`);

  const existing = await prisma.creativeTask.count();
  if (existing === 0) {
    await prisma.creativeTask.createMany({
      data: [
        {
          title: "Lançamento Brinco Solitário — vídeo principal",
          subject: "Brinco Solitário Ouro",
          description: "Hero video 30s para Reels/TikTok do novo lançamento.",
          type: TaskType.LAUNCH,
          priority: Priority.P0,
          status: TaskStatus.BRIEFING,
          productId: products[0].id,
          requestedById: demoUser.id,
          assignedToId: demoUser.id,
          platformTargets: [Platform.META, Platform.TIKTOK],
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Promo Dia das Mães — Colar Coração",
          subject: "Colar Coração Pequeno",
          description: "Estática + carrossel com desconto da campanha.",
          type: TaskType.PROMO,
          priority: Priority.P1,
          status: TaskStatus.BACKLOG,
          productId: products[1].id,
          requestedById: demoUser.id,
          assignedToId: demoUser.id,
          platformTargets: [Platform.META, Platform.GOOGLE],
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Evergreen Aliança — depoimento cliente",
          subject: "Anel Aliança Lisa",
          description: "UGC editado com depoimento real.",
          type: TaskType.EVERGREEN,
          priority: Priority.P2,
          status: TaskStatus.IN_PRODUCTION,
          productId: products[2].id,
          requestedById: demoUser.id,
          assignedToId: demoUser.id,
          platformTargets: [Platform.META],
        },
      ],
    });
    console.log("creative tasks: 3");
  } else {
    console.log(`creative tasks: ${existing} (existing, skip)`);
  }

  const adsExisting = await prisma.ad.count();
  if (adsExisting === 0) {
    await prisma.ad.createMany({
      data: [
        { name: "ADV — Solitário V1", platform: Platform.META, status: AdStatus.ACTIVE, productId: products[0].id },
        { name: "ADV — Coração Promo", platform: Platform.META, status: AdStatus.ACTIVE, productId: products[1].id },
        { name: "GOOG — Aliança Search", platform: Platform.GOOGLE, status: AdStatus.ACTIVE, productId: products[2].id },
      ],
    });
    console.log("ads: 3");
  } else {
    console.log(`ads: ${adsExisting} (existing, skip)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
