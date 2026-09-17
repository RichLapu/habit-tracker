export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const habits = await prisma.habit.findMany({
      where: { userId: session.user.id },
      include: { logs: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(habits);
  } catch (error) {
    console.error("=== ERRO NO GET ===", error);
    return NextResponse.json({ error: "Erro ao buscar hábitos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Agora recebemos também os dias da semana!
    const { title, reminderTimes, daysOfWeek } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "O título é obrigatório" }, { status: 400 });
    }

    const newHabit = await prisma.habit.create({
      data: {
        title,
        userId: session.user.id,
        reminderTimes: reminderTimes || null,
        daysOfWeek: daysOfWeek || "0,1,2,3,4,5,6", // Se não mandar, ativa todos os dias
        isActive: true,
      },
    });

    return NextResponse.json(newHabit, { status: 201 });
  } catch (error) {
    console.error("=== ERRO AO CRIAR HÁBITO ===", error);
    return NextResponse.json({ error: "Erro interno ao criar hábito" }, { status: 500 });
  }
}