import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface CascadeOption {
  key: string;
  label: string;
  defaultChecked?: boolean;
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  cascadeOptions?: CascadeOption[];
  onConfirm: (selectedCascades: string[]) => void;
  isPending?: boolean;
}

export default function DeleteConfirmDialog({
  open, onOpenChange, title, description, cascadeOptions, onConfirm, isPending,
}: DeleteConfirmDialogProps) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open && cascadeOptions) {
      setSelected(cascadeOptions.filter((o) => o.defaultChecked).map((o) => o.key));
    }
  }, [open, cascadeOptions]);

  const toggle = (key: string) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title || "¿Eliminar registro?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {description || "¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {cascadeOptions && cascadeOptions.length > 0 && (
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium">También eliminar:</p>
            {cascadeOptions.map((opt) => (
              <div key={opt.key} className="flex items-center gap-2">
                <Checkbox
                  id={`cascade-${opt.key}`}
                  checked={selected.includes(opt.key)}
                  onCheckedChange={() => toggle(opt.key)}
                />
                <Label htmlFor={`cascade-${opt.key}`} className="text-sm font-normal cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(selected)}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
