import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// O Next.js agora exige que params seja tipado como uma Promise
type RouteParams = { params: Promise<{ id: string }> };

// Rota para ATUALIZAR (Editar) o hábito
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    // 1. Resolvemos a Promise do params primeiro
    const resolvedParams = await params;
    const habitId = resolvedParams.id;

    const { title, reminderTimes } = await request.json();

    const updatedHabit = await prisma.habit.update({
      where: { id: habitId, userId: session.user.id },
      data: { 
        title, 
        reminderTimes: reminderTimes || null 
      },
    });

    return NextResponse.json(updatedHabit);
  } catch (error) {
    console.error("ERRO AO ATUALIZAR:", error);
    return NextResponse.json({ error: "Erro ao atualizar hábito" }, { status: 500 });
  }
}

// Rota para DELETAR o hábito
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    // 1. Resolvemos a Promise do params primeiro
    const resolvedParams = await params;
    const habitId = resolvedParams.id;

    await prisma.habit.delete({
      where: { id: habitId, userId: session.user.id },
    });

    return NextResponse.json({ message: "Hábito deletado" });
  } catch (error) {
    console.error("ERRO AO DELETAR:", error);
    return NextResponse.json({ error: "Erro ao deletar hábito" }, { status: 500 });
  }
}