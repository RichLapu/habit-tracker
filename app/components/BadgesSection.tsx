"use client";

import { useState } from "react";
import { BADGES_LIST } from "@/lib/badges";
import { Award, ChevronDown, Lock } from "lucide-react";

type BadgesSectionProps = {
  habits: any[];
  level: number;
};

export default function BadgesSection({ habits, level }: BadgesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calcula quantas conquistas já foram desbloqueadas
  const unlockedCount = BADGES_LIST.filter((b) =>
    b.isUnlocked(habits, level)
  ).length;

  return (
    <div className="w-full bg-white dark:bg-gray-900/40 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 mt-4 mb-6 overflow-hidden">
      {/* CABEÇALHO DO DROPDOWN */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-1.5 rounded-lg">
            <Award size={18} />
          </div>
          <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">
            Conquistas ({unlockedCount}/{BADGES_LIST.length})
          </span>
        </div>
        <ChevronDown
          size={20}
          className={`text-gray-400 dark:text-gray-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ÁREA COM A GRADE DE CONQUISTAS */}
      <div
        className={`transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-[600px] opacity-100 p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800/50" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BADGES_LIST.map((badge) => {
            const unlocked = badge.isUnlocked(habits, level);

            return (
              <div
                key={badge.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  unlocked
                    ? "bg-amber-500/5 border-amber-500/20 text-gray-800 dark:text-gray-100"
                    : "bg-gray-50/50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600 grayscale opacity-60"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm ${
                    unlocked
                      ? "bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50"
                      : "bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
                  }`}
                >
                  {unlocked ? badge.icon : <Lock size={18} className="text-gray-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold truncate">
                      {badge.title}
                    </h4>
                    {unlocked && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                        Desbloqueado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}