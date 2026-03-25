import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  useAccountingCategories,
  useCreateAccountingMovement,
  type AccountingMovementStatus,
  type AccountingMovementType,
} from "@/hooks/useAccountingData";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormValues = {
  movement_date: string;
  type: AccountingMovementType;
  concept: string;
  category_code: string;
  base_amount: string;
  vat_rate: string;
  payment_method: string;
  status: AccountingMovementStatus;
  deductible: boolean;
  notes: string;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

export default function NewMovementDialog({ open, onOpenChange }: Props) {
  const createMovement = useCreateAccountingMovement();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      movement_date: todayString(),
      type: "expense",
      concept: "",
      category_code: "",
      base_amount: "",
      vat_rate: "21",
      payment_method: "transferencia",
      status: "paid",
      deductible: true,
      notes: "",
    },
  });

  const movementType = watch("type");
  const {
  data: categories = [],
  isLoading: categoriesLoading,
  error: categoriesError,
} = useAccountingCategories(movementType);
  useEffect(() => {
    if (movementType === "income") {
      setValue("status", "collected");
      setValue("deductible", false);
    } else {
      setValue("status", "paid");
      setValue("deductible", true);
    }
    setValue("category_code", "");
  }, [movementType, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      await createMovement.mutateAsync({
        movement_date: values.movement_date,
        type: values.type,
        concept: values.concept.trim(),
        category_code: values.category_code,
        base_amount: Number(values.base_amount),
        vat_rate: Number(values.vat_rate),
        payment_method: values.payment_method || null,
        status: values.status,
        deductible: values.deductible,
        notes: values.notes.trim() || null,
      });

      toast.success("Movimiento creado correctamente");
      reset({
        movement_date: todayString(),
        type: "expense",
        concept: "",
        category_code: "",
        base_amount: "",
        vat_rate: "21",
        payment_method: "transferencia",
        status: "paid",
        deductible: true,
        notes: "",
      });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Error al crear el movimiento");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Nuevo movimiento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Fecha</label>
              <Input type="date" {...register("movement_date", { required: true })} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Tipo</label>
              <select
                {...register("type", { required: true })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Concepto</label>
            <Input
              placeholder="Ej. Campaña Meta Ads marzo"
              {...register("concept", { required: true })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Categoría</label>
              <select
                {...register("category_code", { required: true })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecciona una categoría</option>
                <div className="text-xs text-muted-foreground">
                {categories.map((category) => (
                  <option key={category.id} value={category.code}>
                    {category.name}
                  </option>
                ))}
              </select>
                <div className="text-xs text-muted-foreground mt-2">
                  <p>Tipo actual: {movementType}</p>
                  <p>Categorías cargando: {categoriesLoading ? "sí" : "no"}</p>
                  <p>Número de categorías: {categories.length}</p>
                  <p>Error: {categoriesError ? String(categoriesError) : "ninguno"}</p>
                  </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Método de pago</label>
              <select
                {...register("payment_method")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="efectivo">Efectivo</option>
                <option value="bizum">Bizum</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">Base imponible</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("base_amount", { required: true })}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">IVA (%)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="21"
                {...register("vat_rate", { required: true })}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Estado</label>
              <select
                {...register("status", { required: true })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {movementType === "income" ? (
                  <>
                    <option value="pending">Pendiente</option>
                    <option value="collected">Cobrado</option>
                  </>
                ) : (
                  <>
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagado</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {movementType === "expense" && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("deductible")} />
              Gasto deducible
            </label>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">Notas</label>
            <textarea
              {...register("notes")}
              placeholder="Observaciones internas..."
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || createMovement.isPending}>
              Guardar movimiento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
