import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type RouteParams = { params: Promise<{ id: string }> };

// A MÁGICA MATEMÁTICA: Força o horário do Brasil (UTC-3) independente de onde o servidor esteja
function getBrazilDateString(date: Date) {
  const brtTime = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return brtTime.toISOString().split('T')[0]; // Retorna sempre YYYY-MM-DD certinho
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const resolvedParams = await params;
    const habitId = resolvedParams.id;

    const habit = await prisma.habit.findUnique({
      where: { id: habitId, userId: session.user.id },
      include: { logs: true },
    });

    if (!habit) return NextResponse.json({ error: "Hábito não encontrado" }, { status: 404 });

    const now = new Date();
    const todayStr = getBrazilDateString(now); // Ex: "2026-09-17"

    // Procura se já existe um check HOJE no fuso do Brasil
    const todayLog = habit.logs.find(log => {
      const logDateStr = getBrazilDateString(new Date(log.date));
      return logDateStr === todayStr;
    });

    if (todayLog) {
      await prisma.habitLog.deleteMany({
        where: { id: todayLog.id },
      });
      return NextResponse.json({ message: "Desmarcado com sucesso" });
    } else {
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