import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ContabilidadPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Contabilidad</h1>

      {/* Dashboard rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos (mes)</CardTitle>
          </CardHeader>
          <CardContent>€0</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gastos (mes)</CardTitle>
          </CardHeader>
          <CardContent>€0</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IVA estimado</CardTitle>
          </CardHeader>
          <CardContent>€0</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beneficio</CardTitle>
          </CardHeader>
          <CardContent>€0</CardContent>
        </Card>
      </div>

      {/* Botón añadir movimiento */}
      <div className="flex justify-end">
        <Button>Añadir movimiento</Button>
      </div>

      {/* Tabla placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aquí aparecerán los ingresos y gastos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
