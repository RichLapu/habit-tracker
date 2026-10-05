export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: (habits: any[], level: number) => boolean;
};

// Função auxiliar para calcular a maior sequência (streak) individual em qualquer hábito
const getMaxStreak = (habits: any[]) => {
  let maxGlobalStreak = 0;
  habits.forEach((habit) => {
    if (!habit.logs || habit.logs.length === 0) return;
    const dates = [...new Set(habit.logs.map((l: any) => l.date.split("T")[0]))].sort();
    let currentStreak = 1;
    let maxHabitStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = Math.round(Math.abs(curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
        maxHabitStreak = Math.max(maxHabitStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    maxGlobalStreak = Math.max(maxGlobalStreak, maxHabitStreak);
  });
  return maxGlobalStreak;
};

// Função auxiliar para obter o total de dias únicos em que o usuário usou o app
const getUniqueActiveDays = (habits: any[]) => {
  const allDates = new Set();
  habits.forEach((h) => {
    h.logs?.forEach((l: any) => allDates.add(l.date.split("T")[0]));
  });
  return allDates.size;
};

// Função auxiliar para obter o total de logs (conclusões)
const getTotalLogs = (habits: any[]) => {
  return habits.reduce((acc, h) => acc + (h.logs ? h.logs.length : 0), 0);
};

export const BADGES_LIST: Badge[] = [
  // --- PRIMEIROS PASSOS ---
  { id: "first_habit", title: "Primeiro Passo", description: "Concluiu o seu primeiro hábito.", icon: "🌱", isUnlocked: (habits) => getTotalLogs(habits) >= 1 },
  { id: "habit_creator_1", title: "Arquiteto", description: "Criou o seu primeiro hábito.", icon: "🏗️", isUnlocked: (habits) => habits.length >= 1 },
  
  // --- NÍVEIS (RPG) ---
  { id: "level_2", title: "Em Ascensão", description: "Alcançou o Nível 2.", icon: "⭐", isUnlocked: (_, level) => level >= 2 },
  { id: "level_5", title: "Aventureiro", description: "Alcançou o Nível 5.", icon: "⚔️", isUnlocked: (_, level) => level >= 5 },
  { id: "level_10", title: "Guerreiro Focado", description: "Alcançou o Nível 10.", icon: "🛡️️", isUnlocked: (_, level) => level >= 10 },
  { id: "level_25", title: "Mestre da Disciplina", description: "Alcançou o Nível 25.", icon: "👑", isUnlocked: (_, level) => level >= 25 },
  { id: "level_50", title: "Lenda Viva", description: "Alcançou o Nível 50.", icon: "🐉", isUnlocked: (_, level) => level >= 50 },
  { id: "level_100", title: "Deus da Rotina", description: "Alcançou o incrível Nível 100.", icon: "⚡", isUnlocked: (_, level) => level >= 100 },

  // --- VOLUME DE HÁBITOS ---
  { id: "habit_creator_3", title: "Organizador", description: "Criou 3 hábitos ativos.", icon: "📋", isUnlocked: (habits) => habits.length >= 3 },
  { id: "habit_creator_5", title: "Malabarista", description: "Criou 5 hábitos ativos.", icon: "🤹", isUnlocked: (habits) => habits.length >= 5 },
  { id: "habit_creator_10", title: "Generalista", description: "Criou 10 hábitos ativos.", icon: "🌐", isUnlocked: (habits) => habits.length >= 10 },
  { id: "habit_creator_20", title: "Polímata", description: "Criou 20 hábitos ativos.", icon: "🧠", isUnlocked: (habits) => habits.length >= 20 },

  // --- TOTAL DE CONCLUSÕES (FARMING) ---
  { id: "logs_10", title: "Aquecimento", description: "Completou hábitos 10 vezes no total.", icon: "🏃", isUnlocked: (habits) => getTotalLogs(habits) >= 10 },
  { id: "logs_50", title: "Engrenagem", description: "Completou hábitos 50 vezes no total.", icon: "⚙️", isUnlocked: (habits) => getTotalLogs(habits) >= 50 },
  { id: "logs_100", title: "Máquina", description: "Completou hábitos 100 vezes no total.", icon: "🤖", isUnlocked: (habits) => getTotalLogs(habits) >= 100 },
  { id: "logs_250", title: "Implacável", description: "Completou hábitos 250 vezes no total.", icon: "🚂", isUnlocked: (habits) => getTotalLogs(habits) >= 250 },
  { id: "logs_500", title: "Titã", description: "Completou hábitos 500 vezes no total.", icon: "🗻", isUnlocked: (habits) => getTotalLogs(habits) >= 500 },
  { id: "logs_1000", title: "Imortal", description: "Completou hábitos 1000 vezes no total.", icon: "🌌", isUnlocked: (habits) => getTotalLogs(habits) >= 1000 },

  // --- DIAS ÚNICOS ATIVOS (ENGAJAMENTO) ---
  { id: "active_days_3", title: "Trilha Inicial", description: "Usou o app por 3 dias diferentes.", icon: "🗺️", isUnlocked: (habits) => getUniqueActiveDays(habits) >= 3 },
  { id: "active_days_7", title: "Uma Semana", description: "Usou o app por 7 dias diferentes.", icon: "📅", isUnlocked: (habits) => getUniqueActiveDays(habits) >= 7 },
  { id: "active_days_21", title: "O Hábito Nasce", description: "Usou o app por 21 dias diferentes.", icon: "🔄", isUnlocked: (habits) => getUniqueActiveDays(habits) >= 21 },
  { id: "active_days_30", title: "Ciclo Lunar", description: "Usou o app por 30 dias diferentes.", icon: "🌙", isUnlocked: (habits) => getUniqueActiveDays(habits) >= 30 },
  { id: "active_days_100", title: "Centurião", description: "Usou o app por 100 dias diferentes.", icon: "💯", isUnlocked: (habits) => getUniqueActiveDays(habits) >= 100 },
  { id: "active_days_365", title: "Aniversário de Foco", description: "Usou o app por 365 dias diferentes.", icon: "🎂", isUnlocked: (habits) => getUniqueActiveDays(habits) >= 365 },

  // --- SEQUÊNCIAS (STREAKS) ININTERRUPTAS ---
  { id: "streak_3", title: "Foco Inicial", description: "Manteve 3 dias de sequência em um hábito.", icon: "🔥", isUnlocked: (habits) => getMaxStreak(habits) >= 3 },
  { id: "streak_7", title: "Chama Ardente", description: "Manteve 7 dias de sequência em um hábito.", icon: "☄️️", isUnlocked: (habits) => getMaxStreak(habits) >= 7 },
  { id: "streak_14", title: "Bola de Fogo", description: "Manteve 14 dias de sequência em um hábito.", icon: "🎇", isUnlocked: (habits) => getMaxStreak(habits) >= 14 },
  { id: "streak_30", title: "Vulcão", description: "Manteve 30 dias de sequência em um hábito.", icon: "🌋", isUnlocked: (habits) => getMaxStreak(habits) >= 30 },
  { id: "streak_60", title: "Meteoro", description: "Manteve 60 dias de sequência em um hábito.", icon: "🌠", isUnlocked: (habits) => getMaxStreak(habits) >= 60 },
  { id: "streak_90", title: "Supernova", description: "Manteve 90 dias de sequência em um hábito.", icon: "☀️", isUnlocked: (habits) => getMaxStreak(habits) >= 90 },

  // --- CONQUISTAS ESPECIAIS ---
  { id: "multitask", title: "Polvo", description: "Concluiu 5 hábitos diferentes no mesmo dia.", icon: "🐙", isUnlocked: (habits) => {
      const logsByDate: Record<string, number> = {};
      habits.forEach(h => {
        h.logs?.forEach((l: any) => {
          const date = l.date.split("T")[0];
          logsByDate[date] = (logsByDate[date] || 0) + 1;
        });
      });
      return Object.values(logsByDate).some(count => count >= 5);
  }},
  { id: "weekend_warrior", title: "Guerreiro de Fim de Semana", description: "Concluiu hábitos no Sábado e no Domingo da mesma semana.", icon: "🏕️", isUnlocked: (habits) => {
      let hasSaturday = false;
      let hasSunday = false;
      habits.forEach(h => {
        h.logs?.forEach((l: any) => {
          const dayOfWeek = new Date(l.date).getDay();
          if (dayOfWeek === 6) hasSaturday = true;
          if (dayOfWeek === 0) hasSunday = true;
        });
      });
      return hasSaturday && hasSunday;
  }}
];