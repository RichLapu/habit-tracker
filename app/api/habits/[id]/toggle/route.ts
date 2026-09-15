import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// O Next.js agora exige que params seja tipado como uma Promise
type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const resolvedParams = await params;
    const habitId = resolvedParams.id;

    // Busca o hábito e todos os logs dele
    const habit = await prisma.habit.findUnique({
      where: { id: habitId, userId: session.user.id },
      include: { logs: true },
    });

    if (!habit) return NextResponse.json({ error: "Hábito não encontrado" }, { status: 404 });

    // Pega o exato segundo em que o botão foi clicado
    const now = new Date();
    
    // A MÁGICA DO FUSO HORÁRIO:
    // Converte a data de hoje para string no formato DD/MM/AAAA garantindo que é o horário do BRASIL
    const todayStr = new Intl.DateTimeFormat('pt-BR', { 
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' 
    }).format(now);

    // Procura se já existe um log salvo que, no horário do Brasil, caiu no mesmo dia
    const todayLog = habit.logs.find(log => {
      const logDateStr = new Intl.DateTimeFormat('pt-BR', { 
        timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' 
      }).format(new Date(log.date));
      return logDateStr === todayStr;
    });

    if (todayLog) {
      // Se ACHOU um log de hoje, o clique serve para DESMARCAR (Deleta do banco)
      await prisma.habitLog.deleteMany({
        where: { id: todayLog.id },
      });
      return NextResponse.json({ message: "Desmarcado com sucesso" });
    } else {
      // Se NÃO ACHOU, o clique serve para MARCAR (Cria no banco)
      await prisma.habitLog.create({
        data: { habitId: habit.id, date: now },
      });
      return NextResponse.json({ message: "Marcado com sucesso" });
    }

  } catch (error) {
    console.error("ERRO AO TOGGLE:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}