import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../components/ui/chart";
import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import { Plane, Laptop, ShieldCheck, Plus, Calendar as CalendarIcon, Home, Car, PiggyBank, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { getGoals, createGoal } from "../../services/api";
import type { Goal } from "../../types/goal";
import { toast } from "sonner";
import { DepositGoalDialog } from "../../components/DepositGoalDialog";

const goalSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  target: z.string().min(1, "Valor alvo é obrigatório"),
  current: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  deadline: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'travel': return Plane;
    case 'electronics': return Laptop;
    case 'vehicle': return Car;
    case 'home': return Home;
    case 'emergency': return ShieldCheck;
    case 'investment': return PiggyBank;
    default: return HelpCircle;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'travel': return "#3b82f6"; // blue-500
    case 'electronics': return "#8b5cf6"; // violet-500
    case 'vehicle': return "#ef4444"; // red-500
    case 'home': return "#f59e0b"; // amber-500
    case 'emergency': return "#009FE3"; // brand blue
    case 'investment': return "#06b6d4"; // cyan-500
    default: return "#6b7280"; // gray-500
  }
};

export function Goals() {
  const [activeTab, setActiveTab] = useState("list");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      target: "",
      current: "",
      category: "",
      deadline: "",
    },
  });

  const fetchGoals = async () => {
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (error) {
      console.error("Erro ao carregar metas:", error);
      toast.error("Erro ao carregar metas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const onSubmit = async (data: GoalFormValues) => {
    try {
      await createGoal({
        name: data.name,
        targetAmount: parseFloat(data.target),
        currentAmount: data.current ? parseFloat(data.current) : 0,
        category: data.category,
        deadline: data.deadline,
        color: getCategoryColor(data.category),
      });
      
      toast.success("Meta criada com sucesso!");
      form.reset();
      fetchGoals();
      setActiveTab("list");
    } catch (error) {
      console.error("Erro ao criar meta:", error);
      toast.error("Erro ao criar meta");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Metas Financeiras</h2>
          <p className="text-muted-foreground">Visualize e acompanhe o progresso dos seus sonhos.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Minhas Metas</TabsTrigger>
          <TabsTrigger value="new">Nova Meta</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => {
                const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                const chartData = [{ name: "progress", value: percentage, fill: goal.color }];
                const Icon = getCategoryIcon(goal.category);
                
                return (
                  <Card key={goal.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">{goal.name}</CardTitle>
                        <div className={`p-2 rounded-full bg-opacity-10`} style={{ backgroundColor: `${goal.color}20` }}>
                          <Icon className="h-5 w-5" style={{ color: goal.color }} />
                        </div>
                      </div>
                      <CardDescription>
                        R$ {goal.currentAmount.toLocaleString()} de R$ {goal.targetAmount.toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center pb-6">
                      <div className="h-[180px] w-full relative flex items-center justify-center">
                        <ChartContainer
                          config={{
                            progress: {
                              label: "Progresso",
                              color: goal.color,
                            },
                          }}
                          className="h-full w-full absolute inset-0"
                        >
                          <RadialBarChart
                            data={chartData}
                            startAngle={90}
                            endAngle={-270}
                            innerRadius={60}
                            outerRadius={85}
                          >
                            <PolarAngleAxis
                              type="number"
                              domain={[0, 100]}
                              angleAxisId={0}
                              tick={false}
                            />
                            <RadialBar
                              background
                              dataKey="value"
                              cornerRadius={10}
                              fill={goal.color}
                            />
                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent hideLabel nameKey="progress" />}
                            />
                          </RadialBarChart>
                        </ChartContainer>
                        <div className="z-10 flex flex-col items-center justify-center text-center">
                          <span className="text-3xl font-bold">{percentage}%</span>
                          <span className="text-xs text-muted-foreground uppercase tracking-widest">Concluído</span>
                        </div>
                      </div>
                      <div className="w-full mt-4 space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${percentage}%`, backgroundColor: goal.color }} 
                            />
                          </div>
                        </div>
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => setSelectedGoal(goal)}
                        >
                          Adicionar Valor
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Card para adicionar nova meta (atalho para a aba) */}
              <Card 
                className="border-dashed border-2 flex flex-col items-center justify-center h-full min-h-[300px] cursor-pointer hover:bg-gray-50 transition-colors group"
                onClick={() => setActiveTab("new")}
              >
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                  <Plus className="h-8 w-8 text-gray-400 group-hover:text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-600">Nova Meta</h3>
                <p className="text-sm text-gray-400">Defina um novo objetivo</p>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="new">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Cadastrar Nova Meta</CardTitle>
              <CardDescription>
                Defina seus objetivos financeiros e acompanhe sua evolução.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome da Meta</Label>
                    <Input 
                      id="name" 
                      placeholder="Ex: Viagem para Europa" 
                      {...form.register("name")} 
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="target">Valor Alvo (R$)</Label>
                      <Input 
                        id="target" 
                        type="number" 
                        placeholder="0,00" 
                        {...form.register("target")} 
                      />
                      {form.formState.errors.target && (
                        <p className="text-sm text-red-500">{form.formState.errors.target.message}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="current">Valor Atual (R$)</Label>
                      <Input 
                        id="current" 
                        type="number" 
                        placeholder="0,00" 
                        {...form.register("current")} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select onValueChange={(value) => form.setValue("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="travel">Viagem</SelectItem>
                          <SelectItem value="electronics">Eletrônicos</SelectItem>
                          <SelectItem value="vehicle">Veículo</SelectItem>
                          <SelectItem value="home">Casa</SelectItem>
                          <SelectItem value="emergency">Reserva de Emergência</SelectItem>
                          <SelectItem value="investment">Investimento</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.category && (
                        <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="deadline">Data Limite (Opcional)</Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="deadline" 
                          type="date" 
                          className="pl-9"
                          {...form.register("deadline")} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("list")}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Criar Meta
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedGoal && (
        <DepositGoalDialog
          open={!!selectedGoal}
          goal={selectedGoal}
          onOpenChange={(open) => {
            if (!open) setSelectedGoal(null);
          }}
          onSuccess={fetchGoals}
        />
      )}
    </div>
  );
}
