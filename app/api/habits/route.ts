import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Rota para BUSCAR os hábitos
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

// Rota para CRIAR um hábito
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Agora preparamos para receber o título E os horários
    const { title, reminderTimes } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "O título é obrigatório" }, { status: 400 });
    }

    const newHabit = await prisma.habit.create({
      data: {
        title,
        userId: session.user.id,
        // Se vier vazio do frontend, o Prisma salva como nulo sem reclamar
        reminderTimes: reminderTimes || null, 
      },
    });

    return NextResponse.json(newHabit, { status: 201 });
  } catch (error) {
    // Esta linha vai dedurar o Prisma no seu terminal do VS Code!
    console.error("=== ERRO AO CRIAR HÁBITO ===", error);
    return NextResponse.json({ error: "Erro interno ao criar hábito" }, { status: 500 });
  }
}