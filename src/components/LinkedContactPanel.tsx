import { useState } from "react";
import {
  useContact, useUpdateContact, useContactNotes, useCreateContactNote,
  useUpdateContactNote, useContactTasks, useCreateContactTask, useUpdateContactTaskStatus,
} from "@/hooks/useContactData";
import { LEAD_STATUSES, TEMPERATURE_TAGS, STATUS_TAGS, TEMPERATURE_TAG_COLORS, STATUS_TAG_COLORS, TASK_STATUSES } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { User, Phone, Mail, FileText, Calendar as CalendarIcon, Plus, ExternalLink } from "lucide-react";
import InlineTagSelect from "@/components/InlineTagSelect";

interface LinkedContactPanelProps {
  contactId: string;
}

export default function LinkedContactPanel({ contactId }: LinkedContactPanelProps) {
  const { toast } = useToast();
  const { data: contact, isLoading } = useContact(contactId);
  const { data: notes } = useContactNotes(contactId);
  const { data: tasks } = useContactTasks(contactId);
  const updateContact = useUpdateContact();
  const createNote = useCreateContactNote();
  const updateNote = useUpdateContactNote();
  const createTask = useCreateContactTask();
  const updateTaskStatus = useUpdateContactTaskStatus();

  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", due_date: "", due_time: "10:00" });

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await createNote.mutateAsync({ contact_id: contactId, content: newNote });
    setNewNote("");
    toast({ title: "Nota añadida" });
  };

  const handleUpdateNote = async (noteId: string) => {
    await updateNote.mutateAsync({ id: noteId, content: editingNoteContent, contact_id: contactId });
    setEditingNoteId(null);
    toast({ title: "Nota actualizada" });
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !newTask.due_date) return;
    const dueDateTime = `${newTask.due_date}T${newTask.due_time}:00`;
    await createTask.mutateAsync({ contact_id: contactId, title: newTask.title, description: newTask.description || undefined, due_date: dueDateTime });
    setTaskDialogOpen(false);
    setNewTask({ title: "", description: "", due_date: "", due_time: "10:00" });
    toast({ title: "Tarea creada" });
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "pendiente" ? "completada" : "pendiente";
    await updateTaskStatus.mutateAsync({ id: taskId, status: newStatus });
  };

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
              <>
                {/* Contact Info */}
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

                {/* Tabs: Notes & Tasks */}
                <Tabs defaultValue="notas">
                  <TabsList className="w-full">
                    <TabsTrigger value="notas" className="flex-1"><FileText className="w-3 h-3 mr-1" />Notas</TabsTrigger>
                    <TabsTrigger value="tareas" className="flex-1"><CalendarIcon className="w-3 h-3 mr-1" />Tareas</TabsTrigger>
                  </TabsList>

                  <TabsContent value="notas" className="mt-3 space-y-3">
                    <div className="flex gap-2">
                      <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Escribe una nota..." className="flex-1" rows={2} />
                      <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>Añadir</Button>
                    </div>
                    {notes && notes.length > 0 ? (
                      <div className="space-y-2">
                        {notes.map((note) => (
                          <div key={note.id} className="border rounded-lg p-3">
                            {editingNoteId === note.id ? (
                              <div className="space-y-2">
                                <Textarea value={editingNoteContent} onChange={(e) => setEditingNoteContent(e.target.value)} rows={2} />
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
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(note.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                                    {note.updated_at !== note.created_at && (
                                      <span className="ml-1 italic">(editado {format(new Date(note.updated_at), "dd MMM yyyy HH:mm", { locale: es })})</span>
                                    )}
                                  </p>
                                  <Button size="sm" variant="ghost" onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); }}>Editar</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Sin notas aún</p>
                    )}
                  </TabsContent>

                  <TabsContent value="tareas" className="mt-3 space-y-3">
                    <Button size="sm" onClick={() => setTaskDialogOpen(true)} className="w-full">
                      <Plus className="w-4 h-4 mr-1" />Nueva Tarea
                    </Button>
                    {tasks && tasks.length > 0 ? (
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div key={task.id} className={`flex items-start gap-3 border rounded-lg p-3 ${task.status === "completada" ? "opacity-60" : ""}`}>
                            <Checkbox checked={task.status === "completada"} onCheckedChange={() => handleToggleTask(task.id, task.status)} className="mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${task.status === "completada" ? "line-through" : ""}`}>{task.title}</p>
                              {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                {format(new Date(task.due_date), "dd MMM yyyy HH:mm", { locale: es })}
                              </p>
                            </div>
                            <Badge variant={task.status === "completada" ? "secondary" : "outline"} className="text-xs shrink-0">
                              {TASK_STATUSES.find((s) => s.value === task.status)?.label || task.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Sin tareas</p>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Task creation dialog */}
        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva Tarea</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Título *</Label>
                <Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Fecha *</Label>
                  <Input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} />
                </div>
                <div>
                  <Label>Hora</Label>
                  <Input type="time" value={newTask.due_time} onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTask} disabled={!newTask.title.trim() || !newTask.due_date}>Crear tarea</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
