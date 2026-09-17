import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type RouteParams = { params: Promise<{ id: string }> };

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
    
    // O seu código nativo perfeito para o Fuso do Brasil
    const formatter = new Intl.DateTimeFormat('pt-BR', { 
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' 
    });
    const todayStr = formatter.format(now);

    const todayLog = habit.logs.find(log => {
      return formatter.format(new Date(log.date)) === todayStr;
    });

    if (todayLog) {
      await prisma.habitLog.delete({
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
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}