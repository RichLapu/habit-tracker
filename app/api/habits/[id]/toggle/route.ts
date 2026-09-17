import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type RouteParams = { params: Promise<{ id: string }> };

// A matemática pura que ignora a Vercel e força o horário do Brasil (UTC-3)
function getBrazilDateString(date: Date) {
  const brtTime = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return brtTime.toISOString().split('T')[0]; 
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
    const todayStr = getBrazilDateString(now);

    const todayLog = habit.logs.find(log => {
      return getBrazilDateString(new Date(log.date)) === todayStr;
    });

    if (todayLog) {
      await prisma.habitLog.delete({ where: { id: todayLog.id } });
      return NextResponse.json({ message: "Desmarcado" });
    } else {
      await prisma.habitLog.create({ data: { habitId: habit.id, date: now } });
      return NextResponse.json({ message: "Marcado" });
    }
  } catch (error) {
    console.error("ERRO AO TOGGLE:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}