export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji ou nome de ícone
  isUnlocked: (habits: any[], level: number) => boolean;
};

export const BADGES_LIST: Badge[] = [
  {
    id: "first_habit",
    title: "Primeiro Passo",
    description: "Concluiu o seu primeiro hábito no aplicativo",
    icon: "🌱",
    isUnlocked: (habits) => {
      return habits.some((h) => h.logs && h.logs.length > 0);
    },
  },
  {
    id: "streak_3",
    title: "Foco Inicial",
    description: "Concluiu hábitos em pelo menos 3 dias diferentes",
    icon: "🔥",
    isUnlocked: (habits) => {
      const allDates = new Set();
      habits.forEach((h) => {
        h.logs?.forEach((l: any) => {
          const d = new Date(l.date).toISOString().split("T")[0];
          allDates.add(d);
        });
      });
      return allDates.size >= 3;
    },
  },
  {
    id: "level_2",
    title: "Em Ascensão",
    description: "Alcançou o Nível 2 no aplicativo",
    icon: "⭐",
    isUnlocked: (_, level) => level >= 2,
  },
  {
    id: "habits_10",
    title: "Mestre da Rotina",
    description: "Concluiu 10 ou mais hábitos no total",
    icon: "🏆",
    isUnlocked: (habits) => {
      const totalCompleted = habits.reduce(
        (acc, h) => acc + (h.logs ? h.logs.length : 0),
        0
      );
      return totalCompleted >= 10;
    },
  },
  {
    id: "habit_creator",
    title: "Arquiteto de Rotinas",
    description: "Criou 3 ou mais hábitos ativos",
    icon: "🎯",
    isUnlocked: (habits) => habits.length >= 3,
  },
];