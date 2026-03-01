import { PROPERTY_STATUSES } from "@/lib/types";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const label = PROPERTY_STATUSES.find((s) => s.value === status)?.label || status;

  const classMap: Record<string, string> = {
    disponible: "status-badge-disponible",
    reservado: "status-badge-reservado",
    en_oferta: "status-badge-en-oferta",
    vendido: "status-badge-vendido",
    retirado: "status-badge-retirado",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      } ${classMap[status] || "bg-muted text-muted-foreground"}`}
    >
      {label}
    </span>
  );
}
