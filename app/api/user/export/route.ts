import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

// Função para calcular a sequência real de dias (Streak)
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
  "0": "Dom", "1": "Seg", "2": "Ter", "3": "Qua", "4": "Qui", "5": "Sex", "6": "Sáb"
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });

    // Busca dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, xp: true, level: true }
    });

    // Busca hábitos com seus logs
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
    const userEmail = user?.email || session.user.email || "";
    const userLevel = user?.level || 1;
    const userXp = user?.xp || 0;

    const totalHabits = habits.length;
    const activeHabits = habits.filter(h => h.isActive).length;
    const totalLogsCount = habits.reduce((acc, h) => acc + h.logs.length, 0);
    const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => calculateStreak(h.logs))) : 0;

    // Constrói as linhas da tabela
    const habitsRowsHtml = habits.map(habit => {
      const streak = calculateStreak(habit.logs);
      const days = habit.daysOfWeek
        ? habit.daysOfWeek.split(',').map(d => WEEK_MAP[d] || d).join(', ')
        : 'Todos os dias';
      const times = habit.reminderTimes || 'Sem horário';
      const statusBadge = habit.isActive 
        ? `<span style="background:#dcfce7; color:#15803d; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:11px;">ATIVO</span>`
        : `<span style="background:#f3f4f6; color:#4b5563; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:11px;">PAUSADO</span>`;

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; font-weight: 600; color: #1f2937;">${habit.title}</td>
          <td style="padding: 12px; text-align: center;">${statusBadge}</td>
          <td style="padding: 12px; color: #4b5563; font-size: 13px;">${days}</td>
          <td style="padding: 12px; color: #4b5563; font-size: 13px;">${times}</td>
          <td style="padding: 12px; text-align: center; font-weight: 700; color: #2563eb;">${habit.logs.length}</td>
          <td style="padding: 12px; text-align: center; font-weight: 700; color: #d97706;">🔥 ${streak}d</td>
        </tr>
      `;
    }).join('');

    // Documento HTML formatado
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório - Habit Tracker Pro</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
          }
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; }
        </style>
      </head>
      <body class="p-8 text-slate-800">
        
        <!-- AVISO NA TELA (MANTIDO APENAS NO NAVEGADOR) -->
        <div class="no-print max-w-4xl mx-auto mb-6 p-4 bg-blue-600 text-white rounded-2xl flex justify-between items-center shadow-lg">
          <div>
            <h3 class="font-bold text-lg">📄 Seu Relatório em PDF está pronto!</h3>
            <p class="text-sm text-blue-100">A janela de impressão foi aberta. Selecione <b>"Salvar como PDF"</b> no seu navegador.</p>
          </div>
          <button onclick="window.print()" class="bg-white text-blue-600 px-5 py-2.5 rounded-xl font-extrabold shadow hover:bg-blue-50 transition">
            🖨️ Abrir Impressão / PDF
          </button>
        </div>

        <!-- DOCUMENTO FORMATADO DO RELATÓRIO -->
        <div class="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          
          <!-- CABEÇALHO -->
          <div class="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg">H</div>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight">Habit Tracker Pro</h1>
              </div>
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Relatório Executivo de Desempenho</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-slate-400 font-semibold">EMISSÃO DO RELATÓRIO</p>
              <p class="text-sm font-bold text-slate-700 capitalize">${formattedDate}</p>
            </div>
          </div>

          <!-- INFORMAÇÕES DO USUÁRIO & NÍVEL -->
          <div class="grid grid-cols-3 gap-4 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div class="col-span-2">
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Usuário</p>
              <h2 class="text-xl font-extrabold text-slate-900">${userName}</h2>
              <p class="text-xs font-medium text-slate-500">${userEmail}</p>
            </div>
            <div class="flex flex-col items-end justify-center">
              <div class="bg-amber-100 text-amber-800 border border-amber-200 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
                <span class="text-lg">⭐</span>
                <div>
                  <p class="text-xs font-black uppercase text-amber-600">Nível ${userLevel}</p>
                  <p class="text-xs font-bold text-amber-900">${userXp} XP Acumulados</p>
                </div>
              </div>
            </div>
          </div>

          <!-- CARDS DE ESTATÍSTICAS -->
          <div class="grid grid-cols-4 gap-4 mb-8">
            <div class="bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
              <p class="text-xs font-bold text-blue-600 uppercase">Total de Hábitos</p>
              <p class="text-2xl font-black text-slate-900 mt-1">${totalHabits}</p>
            </div>
            <div class="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
              <p class="text-xs font-bold text-emerald-600 uppercase">Hábitos Ativos</p>
              <p class="text-2xl font-black text-slate-900 mt-1">${activeHabits}</p>
            </div>
            <div class="bg-purple-50/60 p-4 rounded-2xl border border-purple-100">
              <p class="text-xs font-bold text-purple-600 uppercase">Conclusões Totais</p>
              <p class="text-2xl font-black text-slate-900 mt-1">${totalLogsCount}</p>
            </div>
            <div class="bg-orange-50/60 p-4 rounded-2xl border border-orange-100">
              <p class="text-xs font-bold text-orange-600 uppercase">Maior Streak</p>
              <p class="text-2xl font-black text-slate-900 mt-1">🔥 ${bestStreak}d</p>
            </div>
          </div>

          <!-- TABELA DETALHADA -->
          <div class="mb-8">
            <h3 class="text-base font-extrabold text-slate-900 mb-3">Detalhamento dos Hábitos</h3>
            <div class="overflow-hidden rounded-2xl border border-slate-200">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider">
                    <th style="padding: 12px;">Hábito</th>
                    <th style="padding: 12px; text-align: center;">Status</th>
                    <th style="padding: 12px;">Frequência</th>
                    <th style="padding: 12px;">Horários</th>
                    <th style="padding: 12px; text-align: center;">Execuções</th>
                    <th style="padding: 12px; text-align: center;">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  ${habitsRowsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <!-- RODAPÉ -->
          <div class="pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 font-medium">
            <p>Habit Tracker Pro • Sistema de Alta Performance</p>
            <p>Documento gerado automaticamente pelo usuário</p>
          </div>

        </div>

        <script>
          // Abre a caixa de impressão/salvar em PDF automaticamente após carregar
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
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
    console.error("Erro ao gerar relatório:", error);
    return new NextResponse("Erro ao gerar relatório PDF", { status: 500 });
  }
}