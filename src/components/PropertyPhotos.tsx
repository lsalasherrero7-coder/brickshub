import { useRef } from "react";
import { usePropertyPhotos, useUploadPhoto, useDeletePhoto } from "@/hooks/usePropertyData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  propertyId: string;
}

export default function PropertyPhotos({ propertyId }: Props) {
  const { data: photos, isLoading } = usePropertyPhotos(propertyId);
  const uploadMutation = useUploadPhoto();
  const deleteMutation = useDeletePhoto();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      try {
        await uploadMutation.mutateAsync({ propertyId, file });
      } catch (err: any) {
        toast.error(`Error subiendo ${file.name}: ${err.message}`);
      }
    }
    toast.success("Fotos subidas correctamente");
  };

  const handleDelete = async (photoId: string) => {
    try {
      await deleteMutation.mutateAsync({ id: photoId, propertyId });
      toast.success("Foto eliminada");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    }
  };

  if (isLoading) {
    return <Card className="animate-pulse"><CardContent className="p-6"><div className="h-48 bg-muted rounded" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base">Galería de Fotos</CardTitle>
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleUpload(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploadMutation.isPending ? "Subiendo..." : "Subir Fotos"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {(!photos || photos.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No hay fotos aún</p>
            <p className="text-xs mt-1">Sube fotos de la propiedad</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-border aspect-square">
                <img
                  src={photo.file_url}
                  alt={photo.file_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-card hover:text-card hover:bg-destructive"
                    onClick={() => handleDelete(photo.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
