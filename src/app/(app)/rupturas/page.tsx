import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function RupturasPage() {
  const [active, history] = await Promise.all([
    prisma.stockoutEvent.findMany({
      where: { endedAt: null },
      include: { product: true, affectedAds: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.stockoutEvent.findMany({
      where: { endedAt: { not: null } },
      include: { product: true, affectedAds: true },
      orderBy: { endedAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="p-6 space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rupturas</h1>
        <p className="text-sm text-muted-foreground">
          Produtos sem estoque e anúncios afetados. Encerre a ruptura quando o produto voltar.
        </p>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Ativas
            <Badge variant="secondary" className="ml-2 tabular-nums">{active.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {active.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma ruptura ativa. Quando registrar uma, ela aparece aqui.
              </CardContent>
            </Card>
          )}
          {active.map((event) => (
            <StockoutCard key={event.id} event={event} />
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {history.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Sem histórico ainda.
              </CardContent>
            </Card>
          )}
          {history.map((event) => (
            <StockoutCard key={event.id} event={event} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

type StockoutEventWithRels = Awaited<
  ReturnType<typeof prisma.stockoutEvent.findMany>
>[number] extends infer T ? T : never;

function StockoutCard({ event }: { event: StockoutEventWithRels & { product: { name: string; sku: string }; affectedAds: { id: string; name: string }[] } }) {
  const active = !event.endedAt;
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{event.product.name}</CardTitle>
            <CardDescription>SKU {event.product.sku}</CardDescription>
          </div>
          <Badge variant={active ? "destructive" : "secondary"}>
            {active ? "Ativa" : "Encerrada"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>Início: {format(event.startedAt, "dd MMM yyyy", { locale: ptBR })}</span>
          {event.endedAt && (
            <span>Fim: {format(event.endedAt, "dd MMM yyyy", { locale: ptBR })}</span>
          )}
        </div>
        {event.notes && <p className="text-sm">{event.notes}</p>}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Anúncios afetados ({event.affectedAds.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {event.affectedAds.length === 0 ? (
              <span className="text-xs text-muted-foreground">Nenhum vinculado.</span>
            ) : (
              event.affectedAds.map((ad) => (
                <Badge key={ad.id} variant="outline" className="font-normal">
                  {ad.name}
                </Badge>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
