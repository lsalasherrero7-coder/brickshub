import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useContact, useUpdateContact, useContactNotes, useCreateContactNote, useUpdateContactNote, useDeleteContactNote,
  useContactTasks, useCreateContactTask, useUpdateContactTaskStatus, useDeleteContactTask,
  useBuyerProfile, useSuggestedProperties, useDeleteContact,
} from "@/hooks/useContactData";
import { usePropertyVisits } from "@/hooks/useVisitData";
import { LEAD_STATUSES, SOURCE_PORTALS, TASK_STATUSES, CONTACT_TYPES, PROPERTY_TYPES, GARAGE_OPTIONS, FLOOR_OPTIONS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import StatusBadge from "@/components/StatusBadge";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Phone, MapPin, Globe, Building2, Plus, Calendar as CalendarIcon, FileText, Mail, Home, ShoppingCart, Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: contact, isLoading } = useContact(id);
  const { data: notes } = useContactNotes(id);
  const { data: tasks } = useContactTasks(id);
  const { data: buyerProfile } = useBuyerProfile(id);
  const { data: suggestedProperties } = useSuggestedProperties(
    contact?.contact_type === "comprador" ? id : undefined
  );
  const { data: propertyVisits } = usePropertyVisits(contact?.property_id || undefined);
  const updateContact = useUpdateContact();
  const createNote = useCreateContactNote();
  const updateNote = useUpdateContactNote();
  const deleteNote = useDeleteContactNote();
  const createTask = useCreateContactTask();
  const updateTaskStatus = useUpdateContactTaskStatus();
  const deleteTask = useDeleteContactTask();
  const deleteContact = useDeleteContact();

  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", due_date: "", due_time: "10:00" });
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!contact) {
    return <div className="text-center py-12 text-muted-foreground">Contacto no encontrado</div>;
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await createNote.mutateAsync({ contact_id: contact.id, content: newNote });
    setNewNote("");
    toast({ title: "Nota añadida" });
  };

  const handleUpdateNote = async (noteId: string) => {
    await updateNote.mutateAsync({ id: noteId, content: editingNoteContent, contact_id: contact.id });
    setEditingNoteId(null);
    toast({ title: "Nota actualizada" });
  };

  const handleDeleteNote = async () => {
    if (!deleteNoteId) return;
    await deleteNote.mutateAsync({ id: deleteNoteId, contact_id: contact.id });
    setDeleteNoteId(null);
    toast({ title: "Nota eliminada" });
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !newTask.due_date) return;
    const dueDateTime = `${newTask.due_date}T${newTask.due_time}:00`;
    await createTask.mutateAsync({ contact_id: contact.id, title: newTask.title, description: newTask.description || undefined, due_date: dueDateTime });
    setTaskDialogOpen(false);
    setNewTask({ title: "", description: "", due_date: "", due_time: "10:00" });
    toast({ title: "Tarea creada", description: "Se ha añadido al calendario" });
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "pendiente" ? "completada" : "pendiente";
    await updateTaskStatus.mutateAsync({ id: taskId, status: newStatus });
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    await deleteTask.mutateAsync({ id: deleteTaskId, contact_id: contact.id });
    setDeleteTaskId(null);
    toast({ title: "Tarea eliminada" });
  };

  const handleDeleteContact = async (cascades: string[]) => {
    await deleteContact.mutateAsync({ id: contact.id, cascades });
    toast({ title: "Contacto eliminado" });
    navigate("/contactos");
  };

  const statusLabel = LEAD_STATUSES.find((s) => s.value === contact.lead_status)?.label || contact.lead_status;
  const portalLabel = SOURCE_PORTALS.find((s) => s.value === contact.source_portal)?.label || contact.source_portal;
  const isBuyer = contact.contact_type === "comprador";

  const formatEuro = (v: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/contactos")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBuyer ? "bg-info/10" : "bg-primary/10"}`}>
            {isBuyer ? <ShoppingCart className="w-5 h-5 text-info" /> : <Home className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{contact.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{isBuyer ? "Comprador" : "Vendedor"}</Badge>
              <p className="text-muted-foreground text-sm">Detalle del contacto</p>
            </div>
          </div>
        </div>
        <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteContactOpen(true)}>
          <Trash2 className="w-4 h-4 mr-2" />Eliminar
        </Button>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <div><p className="text-xs text-muted-foreground">Nombre</p><p className="font-medium">{contact.name}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div><p className="text-xs text-muted-foreground">Teléfono</p><p className="font-medium">{contact.phone || "—"}</p></div>
            </div>
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{contact.email}</p></div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div><p className="text-xs text-muted-foreground">Dirección</p><p className="font-medium">{contact.address || "—"}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <div><p className="text-xs text-muted-foreground">Portal</p><p className="font-medium">{portalLabel}</p></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Estado</p>
              <Select
                value={contact.lead_status}
                onValueChange={async (value) => {
                  await updateContact.mutateAsync({ id: contact.id, lead_status: value });
                  toast({ title: "Estado actualizado" });
                }}
              >
                <SelectTrigger className="w-[180px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {contact.property_id && (
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Propiedad vinculada</p>
                  <Link to={`/propiedades/${contact.property_id}`} className="text-primary hover:underline text-sm font-medium">Ver propiedad</Link>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Buyer Profile Card */}
      {isBuyer && buyerProfile && (
        <Card>
          <CardHeader><CardTitle className="text-base font-display">Perfil de comprador</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
              {buyerProfile.property_type && (
                <div><p className="text-xs text-muted-foreground">Tipo</p><p className="font-medium">{PROPERTY_TYPES.find(t => t.value === buyerProfile.property_type)?.label || buyerProfile.property_type}</p></div>
              )}
              {buyerProfile.bedrooms_min && (
                <div><p className="text-xs text-muted-foreground">Dormitorios</p><p className="font-medium">{buyerProfile.bedrooms_min}+</p></div>
              )}
              {buyerProfile.bathrooms_min && (
                <div><p className="text-xs text-muted-foreground">Baños</p><p className="font-medium">{buyerProfile.bathrooms_min}+</p></div>
              )}
              {(buyerProfile.budget_min || buyerProfile.budget_max) && (
                <div><p className="text-xs text-muted-foreground">Presupuesto</p><p className="font-medium">{buyerProfile.budget_min ? formatEuro(buyerProfile.budget_min) : "—"} - {buyerProfile.budget_max ? formatEuro(buyerProfile.budget_max) : "—"}</p></div>
              )}
              {buyerProfile.garage && buyerProfile.garage !== "indiferente" && (
                <div><p className="text-xs text-muted-foreground">Garaje</p><p className="font-medium">{GARAGE_OPTIONS.find(o => o.value === buyerProfile.garage)?.label}</p></div>
              )}
              {buyerProfile.preferred_floor && buyerProfile.preferred_floor !== "indiferente" && (
                <div><p className="text-xs text-muted-foreground">Planta</p><p className="font-medium">{FLOOR_OPTIONS.find(o => o.value === buyerProfile.preferred_floor)?.label}</p></div>
              )}
              {buyerProfile.preferred_zones && buyerProfile.preferred_zones.length > 0 && (
                <div className="col-span-full">
                  <p className="text-xs text-muted-foreground mb-1">Zonas preferidas</p>
                  <div className="flex flex-wrap gap-1">{buyerProfile.preferred_zones.map((z: string) => <Badge key={z} variant="secondary" className="text-xs">{z}</Badge>)}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="notas">
        <TabsList>
          <TabsTrigger value="notas"><FileText className="w-4 h-4 mr-1" />Notas</TabsTrigger>
          <TabsTrigger value="tareas"><CalendarIcon className="w-4 h-4 mr-1" />Tareas</TabsTrigger>
          {contact.property_id && <TabsTrigger value="visitas"><Clock className="w-4 h-4 mr-1" />Visitas</TabsTrigger>}
          {isBuyer && <TabsTrigger value="sugeridas"><Building2 className="w-4 h-4 mr-1" />Propiedades sugeridas</TabsTrigger>}
        </TabsList>

        <TabsContent value="notas">
          <Card>
            <CardHeader><CardTitle className="text-base">Notas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Escribe una nota..." className="flex-1" />
                <Button onClick={handleAddNote} disabled={!newNote.trim()}>Añadir</Button>
              </div>
              {notes && notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-3">
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <Textarea value={editingNoteContent} onChange={(e) => setEditingNoteContent(e.target.value)} />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdateNote(note.id)}>Guardar</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingNoteId(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground flex-1">
                              {format(new Date(note.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                              {note.updated_at !== note.created_at && (
                                <span className="ml-1 italic">(editado {format(new Date(note.updated_at), "dd MMM yyyy HH:mm", { locale: es })})</span>
                              )}
                            </p>
                            <Button size="sm" variant="ghost" onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); }}>Editar</Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteNoteId(note.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Sin notas aún</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tareas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Tareas</CardTitle>
              <Button size="sm" onClick={() => setTaskDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />Nueva Tarea
              </Button>
            </CardHeader>
            <CardContent>
              {tasks && tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className={`flex items-start gap-3 border rounded-lg p-3 ${task.status === "completada" ? "opacity-60" : ""}`}>
                      <Checkbox checked={task.status === "completada"} onCheckedChange={() => handleToggleTask(task.id, task.status)} className="mt-0.5" />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${task.status === "completada" ? "line-through" : ""}`}>{task.title}</p>
                        {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {format(new Date(task.due_date), "dd MMM yyyy HH:mm", { locale: es })}
                        </p>
                      </div>
                      <Badge variant={task.status === "completada" ? "secondary" : "outline"} className="text-xs">
                        {TASK_STATUSES.find((s) => s.value === task.status)?.label || task.status}
                      </Badge>
                      <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0" onClick={() => setDeleteTaskId(task.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Sin tareas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {contact.property_id && (
          <TabsContent value="visitas">
            <Card>
              <CardHeader><CardTitle className="text-base">Visitas programadas</CardTitle></CardHeader>
              <CardContent>
                {propertyVisits && propertyVisits.length > 0 ? (
                  <div className="space-y-3">
                    {propertyVisits.map((visit) => {
                      const statusIcon = visit.status === "completada" ? <CheckCircle className="w-4 h-4 text-success" /> : visit.status === "cancelada" ? <XCircle className="w-4 h-4 text-destructive" /> : <Clock className="w-4 h-4 text-warning" />;
                      return (
                        <div key={visit.id} className="flex items-start gap-3 border rounded-lg p-3">
                          {statusIcon}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{visit.client_first_name} {visit.client_last_name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <CalendarIcon className="w-3 h-3" />
                              {format(new Date(visit.visit_date), "dd MMM yyyy HH:mm", { locale: es })}
                            </p>
                            {visit.notes && <p className="text-xs text-muted-foreground mt-1">{visit.notes}</p>}
                          </div>
                          <Badge variant={visit.status === "completada" ? "secondary" : visit.status === "cancelada" ? "destructive" : "outline"} className="text-xs capitalize">
                            {visit.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Sin visitas registradas</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isBuyer && (
          <TabsContent value="sugeridas">
            <Card>
              <CardHeader><CardTitle className="text-base">Propiedades sugeridas</CardTitle></CardHeader>
              <CardContent>
                {suggestedProperties && suggestedProperties.length > 0 ? (
                  <div className="space-y-3">
                    {suggestedProperties.map((p) => (
                      <Link key={p.id} to={`/propiedades/${p.id}`} className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{p.address}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {p.property_type && <span>{PROPERTY_TYPES.find(t => t.value === p.property_type)?.label}</span>}
                              {p.bedrooms != null && <span>{p.bedrooms} hab.</span>}
                              {p.bathrooms != null && <span>{p.bathrooms} baños</span>}
                              {p.surface_area && <span>{p.surface_area} m²</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <StatusBadge status={p.status} />
                            {p.listing_price && <p className="text-sm font-semibold mt-1">{formatEuro(p.listing_price)}</p>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {buyerProfile ? "No hay propiedades que coincidan con el perfil" : "No hay perfil de comprador configurado"}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* New Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Tarea</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} /></div>
            <div><Label>Descripción</Label><Textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fecha *</Label><Input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} /></div>
              <div><Label>Hora</Label><Input type="time" value={newTask.due_time} onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddTask} disabled={!newTask.title.trim() || !newTask.due_date}>Crear Tarea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete contact dialog */}
      <DeleteConfirmDialog
        open={deleteContactOpen}
        onOpenChange={setDeleteContactOpen}
        title="¿Eliminar contacto?"
        description="¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer."
        cascadeOptions={[
          { key: "notes", label: "Notas del contacto", defaultChecked: true },
          { key: "tasks", label: "Tareas del contacto", defaultChecked: true },
          { key: "buyer_profile", label: "Perfil de comprador", defaultChecked: true },
        ]}
        onConfirm={handleDeleteContact}
        isPending={deleteContact.isPending}
      />

      {/* Delete note dialog */}
      <DeleteConfirmDialog
        open={!!deleteNoteId}
        onOpenChange={(open) => !open && setDeleteNoteId(null)}
        title="¿Eliminar nota?"
        onConfirm={handleDeleteNote}
      />

      {/* Delete task dialog */}
      <DeleteConfirmDialog
        open={!!deleteTaskId}
        onOpenChange={(open) => !open && setDeleteTaskId(null)}
        title="¿Eliminar tarea?"
        onConfirm={handleDeleteTask}
      />
    </div>
  );
}
