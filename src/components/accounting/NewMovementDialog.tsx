import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMovement?: unknown;
};

export default function NewMovementDialog({
  open,
  onOpenChange,
  editingMovement,
}: Props) {
  const title = editingMovement ? "Editar movimiento" : "Nuevo movimiento";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            El formulario de movimientos se ha desactivado temporalmente para estabilizar el CRM.
          </p>
          <p className="text-sm text-muted-foreground">
            La pestaña de Contabilidad sigue operativa y volveremos a activar este modal en el siguiente paso.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
