import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  Download,
  FileSpreadsheet,
  Search,
  Receipt,
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAccountingMovements,
  type AccountingMovement,
  type AccountingMovementStatus,
  type AccountingMovementType,
} from "@/hooks/useAccountingData";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function getStatusLabel(status: AccountingMovementStatus) {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "paid":
      return "Pagado";
    case "collected":
      return "Cobrado";
    default:
      return status;
  }
}

function getTypeLabel(type: AccountingMovementType) {
  return type === "income" ? "Ingreso" : "Gasto";
}

function getQuarterFromDate(dateString: string) {
  const month = new Date(dateString).getMonth() + 1;
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
}

export default function ContabilidadPage() {
  const { data: movements = [], isLoading } = useAccountingMovements();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | AccountingMovementType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AccountingMovementStatus>("all");
  const [quarterFilter, setQuarterFilter] = useState<"all" | "1" | "2" | "3" | "4">("all");
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));

  const filteredMovements = useMemo(() => {
    return movements.filter((movement: AccountingMovement) => {
      const matchesSearch =
        movement.concept.toLowerCase().includes(search.toLowerCase()) ||
        movement.category_code.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "all" || movement.type === typeFilter;
      const matchesStatus = statusFilter === "all" || movement.status === statusFilter;
      const matchesYear = !yearFilter || String(movement.fiscal_year) === yearFilter;
      const matchesQuarter =
        quarterFilter === "all" ||
        String(getQuarterFromDate(movement.movement_date)) === quarterFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesYear &&
        matchesQuarter
      );
    });
  }, [movements, search, typeFilter, statusFilter, yearFilter, quarterFilter]);

  const summary = useMemo(() => {
    const incomeBase = filteredMovements
      .filter((m) => m.type === "income")
      .reduce((sum, m) => sum + Number(m.base_amount || 0), 0);

    const expenseBase = filteredMovements
      .filter((m) => m.type === "expense")
      .reduce((sum, m) => sum + Number(m.base_amount || 0), 0);

    const vatRepercutido = filteredMovements
      .filter((m) => m.type === "income")
      .reduce((sum, m) => sum + Number(m.vat_amount || 0), 0);

    const vatSoportado = filteredMovements
      .filter((m) => m.type === "expense")
      .reduce((sum, m) => sum + Number(m.vat_amount || 0), 0);

    const deductibleExpenses = filteredMovements
      .filter((m) => m.type === "expense" && m.deductible)
      .reduce((sum, m) => sum + Number(m.base_amount || 0), 0);

    const netProfit = incomeBase - expenseBase;
    const vatResult = vatRepercutido - vatSoportado;
    const estimatedIrpfBase = incomeBase - deductibleExpenses;
    const estimatedIrpf = estimatedIrpfBase > 0 ? estimatedIrpfBase * 0.2 : 0;

    return {
      incomeBase,
      expenseBase,
      vatRepercutido,
      vatSoportado,
      vatResult,
      netProfit,
      estimatedIrpf,
      movementsCount: filteredMovements.length,
    };
  }, [filteredMovements]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="h-64 rounded bg-muted animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            <h1 className="text-2xl font-semibold tracking-tight">Contabilidad</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Control de ingresos, gastos e impuestos estimados.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo movimiento
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(summary.incomeBase)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Base imponible del periodo filtrado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(summary.expenseBase)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Gastos registrados del periodo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Beneficio neto</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(summary.netProfit)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ingresos menos gastos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">IVA estimado</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(summary.vatResult)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              IVA repercutido menos soportado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">IVA repercutido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {formatCurrency(summary.vatRepercutido)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">IVA soportado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {formatCurrency(summary.vatSoportado)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">IRPF estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {formatCurrency(summary.estimatedIrpf)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Estimación operativa. Validar con gestoría.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{summary.movementsCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar concepto o categoría"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | AccountingMovementType)
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Todos los tipos</option>
              <option value="income">Ingresos</option>
              <option value="expense">Gastos</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | AccountingMovementStatus)
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagado</option>
              <option value="collected">Cobrado</option>
            </select>

            <select
              value={quarterFilter}
              onChange={(e) =>
                setQuarterFilter(e.target.value as "all" | "1" | "2" | "3" | "4")
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Todos los trimestres</option>
              <option value="1">T1</option>
              <option value="2">T2</option>
              <option value="3">T3</option>
              <option value="4">T4</option>
            </select>

            <Input
              placeholder="Año fiscal"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>Movimientos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Vista operativa para control interno y preparación fiscal.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-3 py-3 font-medium">Fecha</th>
                  <th className="px-3 py-3 font-medium">Tipo</th>
                  <th className="px-3 py-3 font-medium">Concepto</th>
                  <th className="px-3 py-3 font-medium">Categoría</th>
                  <th className="px-3 py-3 font-medium">Base</th>
                  <th className="px-3 py-3 font-medium">IVA</th>
                  <th className="px-3 py-3 font-medium">Total</th>
                  <th className="px-3 py-3 font-medium">Estado</th>
                  <th className="px-3 py-3 font-medium">Pago</th>
                  <th className="px-3 py-3 font-medium">Documento</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-10 text-center text-muted-foreground"
                    >
                      No hay movimientos para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((movement) => (
                    <tr key={movement.id} className="border-b last:border-0">
                      <td className="px-3 py-3">
                        {format(new Date(movement.movement_date), "dd MMM yyyy", {
                          locale: es,
                        })}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            movement.type === "income"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {getTypeLabel(movement.type)}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium">{movement.concept}</td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {movement.category_code}
                      </td>
                      <td className="px-3 py-3">
                        {formatCurrency(Number(movement.base_amount))}
                      </td>
                      <td className="px-3 py-3">
                        {formatCurrency(Number(movement.vat_amount))} ({movement.vat_rate}%)
                      </td>
                      <td className="px-3 py-3 font-medium">
                        {formatCurrency(Number(movement.total_amount))}
                      </td>
                      <td className="px-3 py-3">{getStatusLabel(movement.status)}</td>
                      <td className="px-3 py-3">
                        {movement.payment_method || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-muted-foreground">Pendiente</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
