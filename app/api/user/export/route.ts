import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

function calculateStreak(logs: { date: Date | string }[]) {
  if (!logs || logs.length === 0) return 0;
  
  const normalizedDates = [...new Set(logs.map(l => {
    const d = typeof l.date === 'string' ? new Date(l.date) : l.date;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }))].sort((a,b) => b - a);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;

  if (normalizedDates[0] !== today && normalizedDates[0] !== yesterday) return 0;

  let streak = 0;
  let current = normalizedDates[0] === today ? today : yesterday;

  for (const time of normalizedDates) {
    if (time === current) {
      streak++;
      current -= 86400000;
    } else {
      break;
    }
  }
  return streak;
}

const WEEK_MAP: Record<string, string> = {
  "0": "Domingo", "1": "Segunda", "2": "Terça", "3": "Quarta", "4": "Quinta", "5": "Sexta", "6": "Sábado"
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, xp: true, level: true }
    });

    const habits = await prisma.habit.findMany({
      where: { userId: session.user.id },
      include: { logs: true },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(now);

    const userName = user?.name || session.user.name || session.user.email?.split('@')[0] || "Usuário";
    const userLevel = user?.level || 1;
    const userXp = user?.xp || 0;

    const totalHabits = habits.length;
    const activeHabits = habits.filter(h => h.isActive).length;
    const totalLogsCount = habits.reduce((acc, h) => acc + h.logs.length, 0);
    const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => calculateStreak(h.logs))) : 0;

    const habitsRowsHtml = habits.map(habit => {
      const streak = calculateStreak(habit.logs);
      const days = habit.daysOfWeek
        ? habit.daysOfWeek.split(',').map(d => WEEK_MAP[d] || d).join(', ')
        : 'Todos os dias';
      const times = habit.reminderTimes || 'Sem horário';
      const statusBadge = habit.isActive 
        ? `<span class="inline-block bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[11px] whitespace-nowrap">ATIVO</span>`
        : `<span class="inline-block bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold text-[11px] whitespace-nowrap">PAUSADO</span>`;

      return `
        <tr class="border-b border-slate-100">
          <td class="p-3 font-semibold text-slate-800 whitespace-normal">${habit.title}</td>
          <td class="p-3 text-center">${statusBadge}</td>
          <td class="p-3 text-slate-600 text-xs whitespace-normal">${days}</td>
          <td class="p-3 text-slate-600 text-xs whitespace-nowrap">${times}</td>
          <td class="p-3 text-center font-bold text-blue-600">${habit.logs.length}</td>
          <td class="p-3 text-center font-bold text-amber-600 whitespace-nowrap">🔥 ${streak} ${streak === 1 ? 'dia' : 'dias'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório - Habit Tracker Pro</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          @media print {
            body {
              background-color: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .print-card {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
            }
            .stats-grid {
              display: grid !important;
              grid-template-columns: repeat(4, 1fr) !important;
              gap: 1rem !important;
            }
            .user-header {
              display: flex !important;
              flex-direction: row !important;
              justify-content: space-between !important;
              align-items: center !important;
            }
            table {
              width: 100% !important;
              table-layout: auto !important;
            }
            td, th {
              padding: 8px 6px !important;
            }
          }
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        </style>
      </head>
      <body class="bg-slate-50 p-4 sm:p-8 text-slate-800">
        
        <!-- BARRINHA DE AVISO (APENAS NA TELA) -->
        <div class="no-print max-w-4xl mx-auto mb-6 p-4 bg-blue-600 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
          <div>
            <h3 class="font-bold text-lg">📄 Seu Relatório em PDF está pronto!</h3>
            <p class="text-sm text-blue-100">A janela de impressão foi aberta. Selecione <b>"Salvar como PDF"</b> no seu navegador.</p>
          </div>
          <button onclick="window.print()" class="w-full sm:w-auto bg-white text-blue-600 px-5 py-2.5 rounded-xl font-extrabold shadow hover:bg-blue-50 transition">
            🖨️ Abrir Impressão / PDF
          </button>
        </div>

        <!-- RELATÓRIO PRINCIPAL -->
        <div class="print-card max-w-4xl mx-auto bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
          
          <!-- CABEÇALHO -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-6 mb-6 gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg">H</div>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight">Habit Tracker Pro</h1>
              </div>
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Relatório de Desempenho</p>
            </div>
            <div class="text-left sm:text-right">
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Emissão do Relatório</p>
              <p class="text-xs sm:text-sm font-bold text-slate-700 capitalize">${formattedDate}</p>
            </div>
          </div>

          <!-- USUÁRIO E NÍVEL -->
          <div class="user-header flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-slate-50 p-5 rounded-2xl gap-4">
            <div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900">${userName}</h2>
            </div>
            <div class="bg-amber-100 text-amber-900 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm">
              <span class="text-xl">⭐</span>
              <div>
                <p class="text-xs font-black uppercase text-amber-700">Nível ${userLevel}</p>
                <p class="text-xs font-bold text-amber-900">${userXp} XP Acumulados</p>
              </div>
            </div>
          </div>

          <!-- CARDS DE ESTATÍSTICAS -->
          <div class="stats-grid grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div class="bg-blue-50/70 p-4 rounded-2xl">
              <p class="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Total de Hábitos</p>
              <p class="text-2xl font-black text-slate-900 mt-1">${totalHabits}</p>
            </div>
            <div class="bg-emerald-50/70 p-4 rounded-2xl">
              <p class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Hábitos Ativos</p>
              <p class="text-2xl font-black text-slate-900 mt-1">${activeHabits}</p>
            </div>
            <div class="bg-purple-50/70 p-4 rounded-2xl">
              <p class="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Conclusões Totais</p>
              <p class="text-2xl font-black text-slate-900 mt-1">${totalLogsCount}</p>
            </div>
            <div class="bg-orange-50/70 p-4 rounded-2xl">
              <p class="text-[11px] font-bold text-orange-600 uppercase tracking-wider">Maior Streak</p>
              <p class="text-2xl font-black text-slate-900 mt-1">🔥 ${bestStreak} ${bestStreak === 1 ? 'dia' : 'dias'}</p>
            </div>
          </div>

          <!-- TABELA DETALHADA -->
          <div class="mb-6">
            <h3 class="text-base font-extrabold text-slate-900 mb-3">Detalhamento dos Hábitos</h3>
            <div class="overflow-x-auto rounded-2xl border border-slate-200">
              <table class="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <th class="p-3">Hábito</th>
                    <th class="p-3 text-center">Status</th>
                    <th class="p-3">Frequência</th>
                    <th class="p-3">Horários</th>
                    <th class="p-3 text-center">Execuções</th>
                    <th class="p-3 text-center">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  ${habitsRowsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <!-- RODAPÉ -->
          <div class="pt-4 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-medium">
            <p>Habit Tracker Pro • Sistema de Alta Performance</p>
            <p>Documento gerado automaticamente</p>
          </div>

        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    return new NextResponse("Erro ao gerar relatório PDF", { status: 500 });
  }
}