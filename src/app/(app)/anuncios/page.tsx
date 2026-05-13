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
import { AdStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export default async function AnunciosPage() {
  const ads = await prisma.ad.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: { product: true, stockout: { include: { product: true } } },
  });

  return (
    <div className="p-6 space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Anúncios</h1>
        <p className="text-sm text-muted-foreground">
          Status atual dos anúncios cadastrados e motivo de pausa quando aplicável.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ads.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                  Nenhum anúncio cadastrado.
                </TableCell>
              </TableRow>
            )}
            {ads.map((ad) => (
              <TableRow key={ad.id}>
                <TableCell className="font-medium">{ad.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ad.platform}</Badge>
                </TableCell>
                <TableCell>{ad.product?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={ad.status === AdStatus.PAUSED ? "destructive" : "secondary"}>
                    {ad.status === AdStatus.PAUSED ? "Pausado" : "Ativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {ad.pauseReason ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
