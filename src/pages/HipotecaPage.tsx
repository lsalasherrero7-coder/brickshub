import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronDown, Minus, Plus, Calculator } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

const ITP_RATES: Record<string, number> = {
  "Andalucía": 7, "Aragón": 8, "Asturias": 8, "Baleares": 8,
  "Canarias": 6.5, "Cantabria": 10, "Castilla y León": 8,
  "Castilla-La Mancha": 9, "Cataluña": 10, "Extremadura": 8,
  "Galicia": 10, "Madrid": 6, "Murcia": 8, "Navarra": 6,
  "País Vasco": 4, "La Rioja": 7, "Valencia": 10, "Ceuta": 6, "Melilla": 6,
};

const COMUNIDADES = Object.keys(ITP_RATES).sort();

const fmt = (n: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtInt = (n: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function HipotecaPage() {
  const [precio, setPrecio] = useState(200000);
  const [ahorro, setAhorro] = useState(40000);
  const [plazo, setPlazo] = useState(25);
  const [tipoInteres, setTipoInteres] = useState(3.0);
  const [tipoTasa, setTipoTasa] = useState<"fijo" | "variable">("fijo");
  const [comunidad, setComunidad] = useState("Navarra");
  const [estado, setEstado] = useState<"nuevo" | "segunda_mano">("segunda_mano");
  const [amortOpen, setAmortOpen] = useState(false);

  const pctAhorro = precio > 0 ? ((ahorro / precio) * 100) : 0;
  const hipoteca = Math.max(precio - ahorro, 0);

  const calc = useMemo(() => {
    const taxRate = estado === "nuevo" ? 10 : (ITP_RATES[comunidad] || 7);
    const impuestos = precio * (taxRate / 100);
    const gastosNotaria = precio * 0.015;
    const totalGastos = impuestos + gastosNotaria;
    const costeTotalInmueble = precio + totalGastos;

    const r = tipoInteres / 100 / 12;
    const n = plazo * 12;
    let cuota = 0;
    let totalIntereses = 0;

    if (hipoteca > 0 && r > 0 && n > 0) {
      cuota = hipoteca * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      totalIntereses = cuota * n - hipoteca;
    } else if (hipoteca > 0 && n > 0) {
      cuota = hipoteca / n;
    }

    const costeTotalHipoteca = costeTotalInmueble + totalIntereses;
    const pctFinanciacion = precio > 0 ? (hipoteca / precio) * 100 : 0;

    // Amortization table (yearly)
    const amortizacion: { year: number; cuotaAnual: number; principal: number; intereses: number; pendiente: number }[] = [];
    let saldo = hipoteca;
    for (let y = 1; y <= plazo && saldo > 0; y++) {
      let principalAnual = 0;
      let interesesAnual = 0;
      for (let m = 0; m < 12 && saldo > 0; m++) {
        const interesMes = saldo * r;
        const principalMes = Math.min(cuota - interesMes, saldo);
        principalAnual += principalMes;
        interesesAnual += interesMes;
        saldo -= principalMes;
      }
      amortizacion.push({
        year: y,
        cuotaAnual: principalAnual + interesesAnual,
        principal: principalAnual,
        intereses: interesesAnual,
        pendiente: Math.max(saldo, 0),
      });
    }

    return { cuota, totalGastos, costeTotalInmueble, totalIntereses, costeTotalHipoteca, pctFinanciacion, taxRate, amortizacion };
  }, [precio, ahorro, plazo, tipoInteres, comunidad, estado, hipoteca]);

  const chartData = [
    { name: "Distribución", ahorro, hipoteca, intereses: calc.totalIntereses },
  ];

  const barChartData = [
    { name: "Ahorro", value: ahorro, fill: "hsl(var(--primary))" },
    { name: "Hipoteca", value: hipoteca, fill: "hsl(var(--info))" },
    { name: "Intereses", value: calc.totalIntereses, fill: "hsl(var(--warning))" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Cálculo Hipoteca</h1>
          <p className="text-sm text-muted-foreground">Simulador de hipoteca con gastos e impuestos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT PANEL – Inputs */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Datos del préstamo</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* Precio */}
              <div className="space-y-2">
                <Label>Precio del inmueble</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min={50000} max={1000000} step={1000} value={precio}
                    onChange={(e) => setPrecio(Number(e.target.value))} className="flex-1" />
                  <span className="text-sm text-muted-foreground">€</span>
                </div>
                <Slider min={50000} max={1000000} step={1000} value={[precio]}
                  onValueChange={([v]) => setPrecio(v)} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50.000 €</span><span>1.000.000 €</span>
                </div>
              </div>

              {/* Ahorro */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Ahorro aportado</Label>
                  <span className="text-xs font-medium text-primary">{fmt(pctAhorro)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} max={precio} step={1000} value={ahorro}
                    onChange={(e) => setAhorro(Math.min(Number(e.target.value), precio))} className="flex-1" />
                  <span className="text-sm text-muted-foreground">€</span>
                </div>
                <Slider min={0} max={precio} step={1000} value={[ahorro]}
                  onValueChange={([v]) => setAhorro(v)} />
              </div>

              {/* Plazo */}
              <div className="space-y-2">
                <Label>Plazo en años</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min={5} max={40} step={1} value={plazo}
                    onChange={(e) => setPlazo(Number(e.target.value))} className="flex-1" />
                  <span className="text-sm text-muted-foreground">años</span>
                </div>
                <Slider min={5} max={40} step={1} value={[plazo]}
                  onValueChange={([v]) => setPlazo(v)} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 años</span><span>40 años</span>
                </div>
              </div>

              {/* Tipo de interés */}
              <div className="space-y-2">
                <Label>Tipo de interés</Label>
                <ToggleGroup type="single" value={tipoTasa} onValueChange={(v) => v && setTipoTasa(v as "fijo" | "variable")}
                  className="justify-start">
                  <ToggleGroupItem value="fijo" className="px-4">Fijo</ToggleGroupItem>
                  <ToggleGroupItem value="variable" className="px-4">Variable</ToggleGroupItem>
                </ToggleGroup>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                    onClick={() => setTipoInteres((p) => Math.max(+(p - 0.05).toFixed(2), 0))}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input type="number" min={0} max={15} step={0.05} value={tipoInteres}
                    onChange={(e) => setTipoInteres(Number(e.target.value))} className="text-center" />
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                    onClick={() => setTipoInteres((p) => Math.min(+(p + 0.05).toFixed(2), 15))}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm text-muted-foreground ml-1">%</span>
                </div>
              </div>

              {/* Comunidad autónoma */}
              <div className="space-y-2">
                <Label>Comunidad autónoma</Label>
                <Select value={comunidad} onValueChange={setComunidad}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMUNIDADES.map((c) => (
                      <SelectItem key={c} value={c}>{c} (ITP {ITP_RATES[c]}%)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label>Estado del inmueble</Label>
                <RadioGroup value={estado} onValueChange={(v) => setEstado(v as "nuevo" | "segunda_mano")} className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="nuevo" id="nuevo" />
                    <Label htmlFor="nuevo" className="font-normal cursor-pointer">Nuevo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="segunda_mano" id="segunda_mano" />
                    <Label htmlFor="segunda_mano" className="font-normal cursor-pointer">Segunda mano</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL – Results */}
        <div className="lg:col-span-3 space-y-5">
          {/* Cuota mensual */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Cuota mensual estimada</p>
              <p className="text-4xl font-display font-bold text-primary">{fmt(calc.cuota)} €</p>
              <p className="text-xs text-muted-foreground mt-1">Tipo {tipoTasa} al {fmt(tipoInteres)}% · {plazo} años</p>
            </CardContent>
          </Card>

          {/* Desglose */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Desglose financiero</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Precio del inmueble" value={`${fmtInt(precio)} €`} />
              <Row label={`Impuestos (${estado === "nuevo" ? "IVA 10%" : `ITP ${calc.taxRate}%`})`}
                value={`${fmtInt(precio * calc.taxRate / 100)} €`} />
              <Row label="Notaría y registro (~1,5%)" value={`${fmtInt(precio * 0.015)} €`} />
              <Row label="Impuestos y gastos totales" value={`${fmtInt(calc.totalGastos)} €`} bold />
              <hr className="border-border" />
              <Row label="Coste total del inmueble" value={`${fmtInt(calc.costeTotalInmueble)} €`} bold />
              <Row label="Ahorro aportado" value={`${fmtInt(ahorro)} €`} />
              <Row label="Importe hipoteca" value={`${fmtInt(hipoteca)} €`} />
              <Row label="Porcentaje de financiación" value={`${fmt(calc.pctFinanciacion)}%`} />
              <hr className="border-border" />
              <Row label="Interés total hipoteca" value={`${fmtInt(calc.totalIntereses)} €`} />
              <Row label="Coste total con hipoteca" value={`${fmtInt(calc.costeTotalHipoteca)} €`} bold accent />
            </CardContent>
          </Card>

          {/* Chart */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Distribución del coste</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                    <XAxis type="number" tickFormatter={(v) => `${fmtInt(v)} €`} className="text-xs" />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip formatter={(v: number) => `${fmtInt(v)} €`} />
                    <Legend />
                    <Bar dataKey="ahorro" name="Ahorro aportado" stackId="a" fill="hsl(var(--primary))" radius={[4, 0, 0, 4]} />
                    <Bar dataKey="hipoteca" name="Importe hipoteca" stackId="a" fill="hsl(var(--info))" />
                    <Bar dataKey="intereses" name="Interés total" stackId="a" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Amortization table */}
          <Collapsible open={amortOpen} onOpenChange={setAmortOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Tabla de amortización</CardTitle>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${amortOpen ? "rotate-180" : ""}`} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Año</TableHead>
                          <TableHead className="text-right">Cuota anual</TableHead>
                          <TableHead className="text-right">Capital</TableHead>
                          <TableHead className="text-right">Intereses</TableHead>
                          <TableHead className="text-right">Pendiente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calc.amortizacion.map((row) => (
                          <TableRow key={row.year}>
                            <TableCell className="font-medium">{row.year}</TableCell>
                            <TableCell className="text-right">{fmtInt(row.cuotaAnual)} €</TableCell>
                            <TableCell className="text-right">{fmtInt(row.principal)} €</TableCell>
                            <TableCell className="text-right">{fmtInt(row.intereses)} €</TableCell>
                            <TableCell className="text-right">{fmtInt(row.pendiente)} €</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span className={`${bold ? "font-semibold" : ""} ${accent ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}
