import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ProfileProps {
  hasBusiness: boolean;
  setHasBusiness: (value: boolean) => void;
}

export function Profile({ hasBusiness, setHasBusiness }: ProfileProps) {
  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground">
            Gerencie suas preferências e configurações de conta.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Perfil Empresarial</CardTitle>
            <CardDescription>
              Ative esta opção se você deseja gerenciar finanças empresariais além das pessoais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="business-mode" className="flex flex-col space-y-1">
                <span>Possuo empresa</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Habilita o alternador de contexto para separar finanças pessoais e empresariais.
                </span>
              </Label>
              <Switch
                id="business-mode"
                checked={hasBusiness}
                onCheckedChange={setHasBusiness}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
