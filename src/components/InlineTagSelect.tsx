import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagOption {
  value: string;
  label: string;
}

interface InlineTagSelectProps {
  value: string | null;
  options: readonly TagOption[];
  colorMap: Record<string, string>;
  placeholder: string;
  onChange: (value: string) => void;
}

export default function InlineTagSelect({ value, options, colorMap, placeholder, onChange }: InlineTagSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = options.find((o) => o.value === value);
  const colorClass = value ? colorMap[value] || "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground";

  return (
    <div ref={ref} className="relative inline-block">
      <Badge
        className={cn("cursor-pointer text-[10px] px-2 py-0.5 font-medium border-0 hover:opacity-80 transition-opacity", colorClass)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        {current?.label || placeholder}
      </Badge>
      {open && (
        <div
          className="absolute z-50 top-full left-0 mt-1 bg-popover border rounded-md shadow-lg py-1 min-w-[140px]"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors flex items-center gap-2",
                value === opt.value && "font-semibold"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <span className={cn("w-2 h-2 rounded-full shrink-0", colorMap[opt.value]?.split(" ")[0] || "bg-muted")} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
