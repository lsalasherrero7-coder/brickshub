import { useState } from "react";
import {
  useContact, useUpdateContact,
} from "@/hooks/useContactData";
import { LEAD_STATUSES, TEMPERATURE_TAGS, STATUS_TAGS, TEMPERATURE_TAG_COLORS, STATUS_TAG_COLORS } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, ExternalLink } from "lucide-react";
import InlineTagSelect from "@/components/InlineTagSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LinkedContactPanelProps {
  contactId: string;
}

export default function LinkedContactPanel({ contactId }: LinkedContactPanelProps) {
  const { toast } = useToast();
  const { data: contact, isLoading } = useContact(contactId);
  const updateContact = useUpdateContact();

  const handleTagChange = async (field: "temperature_tag" | "status_tag", value: string | null) => {
    await updateContact.mutateAsync({ id: contactId, [field]: value });
    toast({ title: "Etiqueta actualizada" });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-2 gap-2">
          <ExternalLink className="w-4 h-4" />
          Ver contacto vinculado
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Contacto vinculado
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-60px)]">
          <div className="p-4 space-y-4">
            {isLoading || !contact ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-lg">{contact.name} {contact.last_name || ""}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{contact.phone || "Sin teléfono"}</span>
                  </div>
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{contact.email}</span>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Estado</p>
                    <Select
                      value={contact.lead_status}
                      onValueChange={async (value) => {
                        await updateContact.mutateAsync({ id: contactId, lead_status: value });
                        toast({ title: "Estado actualizado" });
                      }}
                    >
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Temperatura</p>
                      <InlineTagSelect
                        value={contact.temperature_tag}
                        options={TEMPERATURE_TAGS}
                        colorMap={TEMPERATURE_TAG_COLORS}
                        onChange={(v) => handleTagChange("temperature_tag", v)}
                        placeholder="Temperatura"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Estado tag</p>
                      <InlineTagSelect
                        value={contact.status_tag}
                        options={STATUS_TAGS}
                        colorMap={STATUS_TAG_COLORS}
                        onChange={(v) => handleTagChange("status_tag", v)}
                        placeholder="Estado"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
