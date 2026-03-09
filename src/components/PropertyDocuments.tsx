import { useRef, useState } from "react";
import { usePropertyDocuments, useUploadDocument, useDeleteDocument, useRenameDocument } from "@/hooks/usePropertyData";
import { DOCUMENT_TYPES } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Trash2, CheckCircle, XCircle, ExternalLink, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface Props {
  propertyId: string;
}

export default function PropertyDocuments({ propertyId }: Props) {
  const { data: documents, isLoading } = usePropertyDocuments(propertyId);
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  const renameMutation = useRenameDocument();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [customName, setCustomName] = useState("");
  const [deleteDoc, setDeleteDoc] = useState<{ id: string; fileUrl: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const getDocForType = (type: string) => documents?.filter((d) => d.document_type === type) || [];

  const handleUpload = async (documentType: string, file: File, name?: string) => {
    try {
      await uploadMutation.mutateAsync({ propertyId, documentType, customName: name, file });
      toast.success("Documento subido correctamente");
    } catch (err: any) {
      toast.error(err.message || "Error al subir documento");
    }
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteDoc.id, propertyId, fileUrl: deleteDoc.fileUrl });
      toast.success("Documento eliminado");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setDeleteDoc(null);
    }
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await renameMutation.mutateAsync({ id, propertyId, customName: editName.trim() });
      toast.success("Nombre actualizado");
    } catch (err: any) {
      toast.error(err.message || "Error al renombrar");
    } finally {
      setEditingId(null);
      setEditName("");
    }
  };

  if (isLoading) {
    return <Card className="animate-pulse"><CardContent className="p-6"><div className="h-48 bg-muted rounded" /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Documentación Requerida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DOCUMENT_TYPES.filter((dt) => dt.value !== "otros").map((dt) => {
            const docs = getDocForType(dt.value);
            const hasDoc = docs.length > 0;
            const doc = docs[0];
            const isEditing = hasDoc && editingId === doc.id;

            return (
              <div
                key={dt.value}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  hasDoc ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {hasDoc ? (
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(doc.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => saveEdit(doc.id)}>
                          <Check className="w-3.5 h-3.5 text-success" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}>
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium">{doc?.custom_name || dt.label}</p>
                        {hasDoc && (
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.file_name} — {format(new Date(doc.uploaded_at), "dd MMM yyyy", { locale: es })}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {hasDoc && !isEditing && (
                    <>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(doc.id, doc.custom_name || dt.label)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteDoc({ id: doc.id, fileUrl: doc.file_url })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    ref={(el) => { fileInputRefs.current[dt.value] = el; }}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(dt.value, file);
                      e.target.value = "";
                    }}
                  />
                  {!isEditing && (
                    <Button
                      variant="outline" size="sm"
                      onClick={() => fileInputRefs.current[dt.value]?.click()}
                      disabled={uploadMutation.isPending}
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      {hasDoc ? "Reemplazar" : "Subir"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Otros documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Otros Documentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {getDocForType("otros").map((doc) => {
            const isEditing = editingId === doc.id;
            return (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(doc.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => saveEdit(doc.id)}>
                        <Check className="w-3.5 h-3.5 text-success" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}>
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.custom_name || doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(doc.uploaded_at), "dd MMM yyyy", { locale: es })}
                      </p>
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(doc.id, doc.custom_name || doc.file_name)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteDoc({ id: doc.id, fileUrl: doc.file_url })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-2 pt-2">
            <Input
              placeholder="Nombre del documento..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1"
            />
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              ref={(el) => { fileInputRefs.current["otros"] = el; }}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleUpload("otros", file, customName || undefined);
                  setCustomName("");
                }
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRefs.current["otros"]?.click()}
              disabled={uploadMutation.isPending}
            >
              <Upload className="w-4 h-4 mr-2" />
              Subir
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={!!deleteDoc}
        onOpenChange={(o) => !o && setDeleteDoc(null)}
        title="¿Eliminar documento?"
        description="¿Estás seguro de que quieres eliminar este documento? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
