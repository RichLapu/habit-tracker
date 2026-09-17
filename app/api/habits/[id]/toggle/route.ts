import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// A matemática pura que ignora a Vercel e força o horário do Brasil (UTC-3)
function getBrazilDateString(date: Date) {
  const brtTime = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return brtTime.toISOString().split('T')[0]; 
}

// Usamos context: any para o Next.js não reclamar da tipagem, e extraímos o ID com segurança
export async function POST(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    // Pega o ID de forma segura (funciona em qualquer versão da Vercel/Next.js)
    const params = await context.params;
    const habitId = params.id;

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
      // VOLTAMOS PARA O DELETEMANY: Muito mais seguro para o banco de dados
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
    // Isso vai dedurar o erro exato lá nos logs da Vercel
    console.error("ERRO AO TOGGLE:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}