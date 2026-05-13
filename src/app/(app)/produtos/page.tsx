import { prisma } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { creativeTasks: true, stockouts: true } },
    },
  });

  return (
    <div className="p-6 space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo manual usado para vincular criativos e rupturas.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Margem</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Criativos</TableHead>
              <TableHead className="text-right">Rupturas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                  Nenhum produto cadastrado.
                </TableCell>
              </TableRow>
            )}
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.margin ? `${(Number(p.margin) * 100).toFixed(0)}%` : "—"}</TableCell>
                <TableCell>{p.priorityTier ? <Badge variant="outline">{p.priorityTier}</Badge> : "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{p._count.creativeTasks}</TableCell>
                <TableCell className="text-right tabular-nums">{p._count.stockouts}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
