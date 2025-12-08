import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../components/ui/chart";
import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import { Target, Plane, Laptop, ShieldCheck } from "lucide-react";

const goalsData = [
  {
    id: 1,
    name: "Viagem de Férias",
    current: 3000,
    target: 5000,
    icon: Plane,
    color: "#3b82f6", // blue-500
  },
  {
    id: 2,
    name: "Reserva de Emergência",
    current: 8500,
    target: 10000,
    icon: ShieldCheck,
    color: "#10b981", // emerald-500
  },
  {
    id: 3,
    name: "Novo MacBook",
    current: 2000,
    target: 12000,
    icon: Laptop,
    color: "#8b5cf6", // violet-500
  },
];

export function Goals() {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Metas Financeiras</h2>
        <p className="text-muted-foreground">Visualize e acompanhe o progresso dos seus sonhos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goalsData.map((goal) => {
          const percentage = Math.round((goal.current / goal.target) * 100);
          const chartData = [{ name: "progress", value: percentage, fill: goal.color }];
          
          return (
            <Card key={goal.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{goal.name}</CardTitle>
                  <div className={`p-2 rounded-full bg-opacity-10`} style={{ backgroundColor: `${goal.color}20` }}>
                    <goal.icon className="h-5 w-5" style={{ color: goal.color }} />
                  </div>
                </div>
                <CardDescription>
                  R$ {goal.current.toLocaleString()} de R$ {goal.target.toLocaleString()}
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
                <div className="w-full mt-4 space-y-1">
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
              </CardContent>
            </Card>
          );
        })}
        
        {/* Card para adicionar nova meta */}
        <Card className="border-dashed border-2 flex flex-col items-center justify-center h-full min-h-[300px] cursor-pointer hover:bg-gray-50 transition-colors group">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
            <Target className="h-8 w-8 text-gray-400 group-hover:text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-600">Nova Meta</h3>
          <p className="text-sm text-gray-400">Defina um novo objetivo</p>
        </Card>
      </div>
    </div>
  );
}
