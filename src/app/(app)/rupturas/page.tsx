import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canEdit } from "@/lib/permissions";
import { StockoutsList } from "@/components/rupturas/StockoutsList";

export const dynamic = "force-dynamic";

export default async function RupturasPage() {
  const me = await getCurrentUser();
  const items = await prisma.stockoutItem.findMany({
    orderBy: [{ status: "asc" }, { product: "asc" }],
  });

  const initialItems = items.map((i) => ({
    id: i.id,
    product: i.product,
    category: i.category,
    status: i.status,
    notes: i.notes,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));

  return (
    <div className="p-6 space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rupturas</h1>
        <p className="text-sm text-muted-foreground">
          Produtos ou categorias em ruptura. Clique no badge de status para alternar entre ativo e inativo.
        </p>
      </div>

      <StockoutsList initialItems={initialItems} canEdit={canEdit(me)} />
    </div>
  );
}
