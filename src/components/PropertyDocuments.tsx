import { useRef, useState } from "react";
import { usePropertyDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/usePropertyData";
import { DOCUMENT_TYPES } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Trash2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
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
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [customName, setCustomName] = useState("");
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  const getDocForType = (type: string) => {
    return documents?.filter((d) => d.document_type === type) || [];
  };

  const handleUpload = async (documentType: string, file: File, name?: string) => {
    try {
      await uploadMutation.mutateAsync({ propertyId, documentType, customName: name, file });
      toast.success("Documento subido correctamente");
    } catch (err: any) {
      toast.error(err.message || "Error al subir documento");
    }
  };

  const handleDelete = async () => {
    if (!deleteDocId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteDocId, propertyId });
      toast.success("Documento eliminado");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setDeleteDocId(null);
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

            return (
              <div
                key={dt.value}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  hasDoc ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  {hasDoc ? (
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{dt.label}</p>
                    {hasDoc && (
                      <p className="text-xs text-muted-foreground">
                        {docs[0].file_name} — {format(new Date(docs[0].uploaded_at), "dd MMM yyyy", { locale: es })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasDoc && (
                    <>
                      <a href={docs[0].file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteDocId(docs[0].id)}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRefs.current[dt.value]?.click()}
                    disabled={uploadMutation.isPending}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {hasDoc ? "Reemplazar" : "Subir"}
                  </Button>
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
          {getDocForType("otros").map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{doc.custom_name || doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(doc.uploaded_at), "dd MMM yyyy", { locale: es })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteDocId(doc.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

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

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteDocId}
        onOpenChange={(o) => !o && setDeleteDocId(null)}
        title="¿Eliminar documento?"
        description="¿Estás seguro de que quieres eliminar este documento? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
