import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

export default function AdminUsersPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: { email, password },
    });

    if (error || data?.error) {
      toast({
        title: "Error al crear usuario",
        description: error?.message || data?.error,
        variant: "destructive",
      });
    } else {
      toast({ title: "Usuario creado", description: `Se ha creado la cuenta para ${email}` });
      setEmail("");
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-foreground mb-6">Gestión de Usuarios</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Crear nuevo usuario
          </CardTitle>
          <CardDescription>
            Solo el administrador puede crear cuentas. El registro público está desactivado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nuevo@usuario.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creando..." : "Crear usuario"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
