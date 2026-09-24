"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChevronDown, BarChart2 } from "lucide-react";

type Habit = {
  id: string;
  logs: { date: Date | string }[];
};

export default function ProgressChart({ habits }: { habits: Habit[] }) {
  // Estado que controla se o gráfico está visível ou não
  const [isOpen, setIsOpen] = useState(false);

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

  // Customização do balão que aparece ao passar o mouse
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
    <div className="w-full bg-white dark:bg-gray-900/40 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 mt-5 mb-6 overflow-hidden">
      
      {/* BOTÃO DO DROPDOWN (CABEÇALHO) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg">
            <BarChart2 size={18} />
          </div>
          <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">
            Desempenho dos Últimos 7 Dias
          </span>
        </div>
        <ChevronDown
          size={20}
          className={`text-gray-400 dark:text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ÁREA DO GRÁFICO (EXPANSÍVEL) */}
      <div 
        className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-5 h-52 w-full border-t border-gray-100 dark:border-gray-800/50">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
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
                    // No Dark mode, a barra de Hoje fica Azul forte e as outras azul escuras/acinzentadas
                    fill={entry.isToday ? "#3b82f6" : "currentColor"} 
                    className={!entry.isToday ? "text-blue-200 dark:text-blue-900/50" : ""}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}