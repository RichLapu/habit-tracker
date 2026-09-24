"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type Habit = {
  id: string;
  logs: { date: Date | string }[];
};

export default function ProgressChart({ habits }: { habits: Habit[] }) {
  // Gera os últimos 7 dias
  const data = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateString = d.toISOString().split('T')[0];
    
    // Conta quantos hábitos foram concluídos neste dia específico
    let count = 0;
    habits.forEach(habit => {
       const hasLog = habit.logs.some(log => {
           const logDate = new Date(log.date).toISOString().split('T')[0];
           return logDate === dateString;
       });
       if (hasLog) count++;
    });

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    data.push({
      name: i === 0 ? 'Hoje' : weekDays[d.getDay()],
      completados: count,
      isToday: i === 0
    });
  }

  // Customização do balão que aparece ao passar o mouse (Tooltip)
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-xl shadow-lg">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
            {payload[0].value} {payload[0].value === 1 ? 'hábito concluído' : 'hábitos concluídos'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 mt-6 mb-8">
      <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 mb-6 uppercase tracking-widest">
        Desempenho dos Últimos 7 Dias
      </h3>
      
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
            <Bar dataKey="completados" radius={[6, 6, 6, 6]} barSize={32}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  // Destaca a barra de "Hoje" com uma cor diferente
                  fill={entry.isToday ? "#2563eb" : "#93c5fd"} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}