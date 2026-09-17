import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Pega o dia exato no Brasil (ex: "2026-09-17")
function getBrazilDateString(date: Date) {
  const brtTime = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return brtTime.toISOString().split('T')[0]; 
}

export async function POST(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const habitId = parts[parts.length - 2]; 

    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId: session.user.id },
      include: { logs: true },
    });

    if (!habit) return NextResponse.json({ error: "Hábito não encontrado" }, { status: 404 });

    const now = new Date();
    const todayStr = getBrazilDateString(now); 

    // O SEGREDO: Criamos a data cravada na meia-noite para não quebrar a regra de "1 por dia" da AWS
    const normalizedDate = new Date(`${todayStr}T00:00:00.000Z`);

    const todayLog = habit.logs.find(log => {
      // Comparamos a data ignorando horas e segundos
      const logDateStr = new Date(log.date).toISOString().split('T')[0];
      return logDateStr === todayStr;
    });

    if (todayLog) {
      await prisma.habitLog.deleteMany({
        where: { id: todayLog.id },
      });
      return NextResponse.json({ message: "Desmarcado" });
    } else {
      // Mandamos a data limpa para evitar o "Unique constraint failed"
      await prisma.habitLog.create({
        data: { habitId: habit.id, date: normalizedDate },
      });
      return NextResponse.json({ message: "Marcado" });
    }
  } catch (error) {
    console.error("ERRO AO TOGGLE:", error);
    return NextResponse.json(
      { error: "Erro interno", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}