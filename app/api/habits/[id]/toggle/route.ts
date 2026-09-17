import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Matemática Pura: Força o horário do Brasil (UTC-3)
function getBrazilDateString(date: Date) {
  const brtTime = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return brtTime.toISOString().split('T')[0]; 
}

export async function POST(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    // TÁTICA BLINDADA: Arrancamos o ID direto do link (URL) em vez de confiar no Next.js
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const habitId = parts[parts.length - 2]; // O ID sempre é o penúltimo item na URL

    const habit = await prisma.habit.findFirst({
      where: { 
        id: habitId, 
        userId: session.user.id 
      },
      include: { logs: true },
    });

    if (!habit) return NextResponse.json({ error: "Hábito não encontrado", idBuscado: habitId }, { status: 404 });

    const now = new Date();
    const todayStr = getBrazilDateString(now);

    const todayLog = habit.logs.find(log => {
      return getBrazilDateString(new Date(log.date)) === todayStr;
    });

    if (todayLog) {
      await prisma.habitLog.deleteMany({
        where: { id: todayLog.id },
      });
      return NextResponse.json({ message: "Desmarcado" });
    } else {
      await prisma.habitLog.create({
        data: { habitId: habit.id, date: now },
      });
      return NextResponse.json({ message: "Marcado" });
    }
  } catch (error) {
    console.error("ERRO AO TOGGLE:", error);
    // Agora ele devolve o erro real para podermos ler!
    return NextResponse.json(
      { error: "Erro interno", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}