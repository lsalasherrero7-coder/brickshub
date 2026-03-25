import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type AccountingMovementType = "income" | "expense";
export type AccountingMovementStatus = "pending" | "paid" | "collected";

export interface AccountingMovement {
  id: string;
  movement_date: string;
  type: AccountingMovementType;
  concept: string;
  category_code: string;
  base_amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  payment_method: string | null;
  status: AccountingMovementStatus;
  deductible: boolean;
  fiscal_year: number;
  fiscal_quarter: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountingCategory {
  id: string;
  type: AccountingMovementType;
  code: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface AccountingDocument {
  id: string;
  movement_id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  document_type: string;
  uploaded_at: string;
}

function getFiscalQuarter(dateString: string) {
  const month = new Date(dateString).getMonth() + 1;
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
}

function getFiscalYear(dateString: string) {
  return new Date(dateString).getFullYear();
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function useAccountingCategories(type?: AccountingMovementType) {
  return useQuery({
    queryKey: ["accounting_categories", type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as AccountingCategory[];

      if (!type) return rows;

      return rows.filter((row) => String(row.type).trim().toLowerCase() === type);
    },
  });
}

export function useAccountingMovements() {
  return useQuery({
    queryKey: ["accounting_movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_movements")
        .select("*")
        .order("movement_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as AccountingMovement[];
    },
  });
}

export function useCreateAccountingMovement() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (movement: {
      movement_date: string;
      type: AccountingMovementType;
      concept: string;
      category_code: string;
      base_amount: number;
      vat_rate: number;
      payment_method?: string | null;
      status?: AccountingMovementStatus;
      deductible?: boolean;
      notes?: string | null;
    }) => {
      const vatAmount = round2(movement.base_amount * (movement.vat_rate / 100));
      const totalAmount = round2(movement.base_amount + vatAmount);
      const fiscalYear = getFiscalYear(movement.movement_date);
      const fiscalQuarter = getFiscalQuarter(movement.movement_date);

      const payload = {
        movement_date: movement.movement_date,
        type: movement.type,
        concept: movement.concept,
        category_code: movement.category_code,
        base_amount: round2(movement.base_amount),
        vat_rate: movement.vat_rate,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        payment_method: movement.payment_method ?? null,
        status: movement.status ?? "pending",
        deductible: movement.deductible ?? movement.type === "expense",
        fiscal_year: fiscalYear,
        fiscal_quarter: fiscalQuarter,
        notes: movement.notes ?? null,
      };

      const { data, error } = await supabase
        .from("accounting_movements")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as AccountingMovement;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting_movements"] });
    },
  });
}

export function useUpdateAccountingMovement() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      movement: Partial<AccountingMovement> & {
        id: string;
      }
    ) => {
      const updates: Record<string, unknown> = {
        ...movement,
        updated_at: new Date().toISOString(),
      };

      if (
        movement.base_amount !== undefined &&
        movement.vat_rate !== undefined
      ) {
        const baseAmount = Number(movement.base_amount);
        const vatRate = Number(movement.vat_rate);
        updates.vat_amount = round2(baseAmount * (vatRate / 100));
        updates.total_amount = round2(baseAmount + Number(updates.vat_amount));
      }

      if (movement.movement_date) {
        updates.fiscal_year = getFiscalYear(movement.movement_date);
        updates.fiscal_quarter = getFiscalQuarter(movement.movement_date);
      }

      const { data, error } = await supabase
        .from("accounting_movements")
        .update(updates)
        .eq("id", movement.id)
        .select()
        .single();

      if (error) throw error;
      return data as AccountingMovement;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting_movements"] });
    },
  });
}

export function useDeleteAccountingMovement() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("accounting_movements")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting_movements"] });
    },
  });
}

export function useAccountingDocuments(movementId: string | undefined) {
  return useQuery({
    queryKey: ["accounting_documents", movementId],
    enabled: !!movementId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_documents")
        .select("*")
        .eq("movement_id", movementId!)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as AccountingDocument[];
    },
  });
}

export function useUploadAccountingDocument() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movementId,
      file,
      documentType = "other",
    }: {
      movementId: string;
      file: File;
      documentType?: string;
    }) => {
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const filePath = `${year}/${month}/${movementId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("accounting-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("accounting_documents")
        .insert({
          movement_id: movementId,
          file_name: file.name,
          file_path: filePath,
          mime_type: file.type || null,
          document_type: documentType,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AccountingDocument;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["accounting_documents", vars.movementId] });
    },
  });
}

export function useDeleteAccountingDocument() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      movementId,
      filePath,
    }: {
      id: string;
      movementId: string;
      filePath: string;
    }) => {
      await supabase.storage.from("accounting-documents").remove([filePath]);

      const { error } = await supabase
        .from("accounting_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["accounting_documents", vars.movementId] });
    },
  });
}

export async function getAccountingDocumentSignedUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from("accounting-documents")
    .createSignedUrl(filePath, 60 * 10);

  if (error) throw error;
  return data.signedUrl;
}
