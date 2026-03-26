import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import {
  useCreateMovement,
  useUpdateMovement,
  type AccountingMovement,
} from "@/hooks/useAccountingData";

export default function NewMovementDialog({
  open,
  onOpenChange,
  editingMovement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMovement?: AccountingMovement | null;
}) {
  const createMovement = useCreateMovement();
  const updateMovement = useUpdateMovement();

  const [concept, setConcept] = useState("");
  const [baseAmount, setBaseAmount] = useState("");
  const [vatRate, setVatRate] = useState("21");
  const [type, setType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // 👉 Cargar datos si editas
  useEffect(() => {
    if (editingMovement) {
      setConcept(editingMovement.concept || "");
      setBaseAmount(String(editingMovement.base_amount || ""));
      setVatRate(String(editingMovement.vat_rate || 21));
      setType(editingMovement.type);
      setCategory(editingMovement.category_code || "");
      setDate(editingMovement.movement_date?.split("T")[0] || "");
    } else {
      resetForm();
    }
  }, [editingMovement]);

  const resetForm = () => {
    setConcept("");
    setBaseAmount("");
    setVatRate("21");
    setType("income");
    setCategory("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleSubmit = async () => {
    if (!concept || !baseAmount || !category) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    const base = Number(baseAmount);
    const vat = (base * Number(vatRate)) / 100;
    const total = base + vat;

    try {
      if (editingMovement) {
        // ✏️ EDITAR
        await updateMovement.mutateAsync({
          id: editingMovement.id,
          updates: {
            concept,
            base_amount: base,
            vat_rate: Number(vatRate),
            vat_amount: vat,
            total_amount: total,
            type,
            category_code: category,
            movement_date: date,
          },
        });

        toast.success("Movimiento actualizado");
      } else {
        // ➕ CREAR
        await createMovement.mutateAsync({
          concept,
          base_amount: base,
          vat_rate: Number(vatRate),
          vat_amount: vat,
          total_amount: total,
          type,
          category_code: category,
          movement_date: date,
          status: "pending",
          fiscal_year: new Date(date).getFullYear(),
        });

        toast.success("Movimiento creado");
      }

      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingMovement ? "Editar movimiento" : "Nuevo movimiento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Concepto"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
          />

          <Input
            placeholder="Base (€)"
            type="number"
            value={baseAmount}
            onChange={(e) => setBaseAmount(e.target.value)}
          />

          <Input
            placeholder="IVA (%)"
            type="number"
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value as "income" | "expense")}
            className="w-full h-10 border rounded-md px-3"
          >
            <option value="income">Ingreso</option>
            <option value="expense">Gasto</option>
          </select>

          <Input
            placeholder="Categoría (code)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <Button
            onClick={handleSubmit}
            disabled={
              createMovement.isPending || updateMovement.isPending
            }
            className="w-full"
          >
            {editingMovement ? "Guardar cambios" : "Crear movimiento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
