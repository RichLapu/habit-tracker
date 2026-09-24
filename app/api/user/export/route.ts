import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });

    const habits = await prisma.habit.findMany({
      where: { userId: session.user.id },
      include: { logs: true },
      orderBy: { createdAt: 'desc' }
    });

    // Cabeçalho do arquivo
    let csvContent = "Hábito,Status,Total de Checks,Data de Criação\n";

    habits.forEach(habit => {
      const title = habit.title.replace(/,/g, ""); // Remove vírgulas para não bugar as colunas do Excel
      const status = habit.isActive ? "Ativo" : "Pausado";
      const totalLogs = habit.logs.length;
      const createdAt = habit.createdAt.toLocaleDateString('pt-BR');

      csvContent += `${title},${status},${totalLogs},${createdAt}\n`;
    });

    // O BOM (Byte Order Mark) garante que o Excel leia acentuação perfeitamente
    const bom = "\uFEFF"; 

    return new NextResponse(bom + csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="meus_habitos.csv"',
      },
    });
  } catch (error) {
    return new NextResponse("Erro ao gerar arquivo", { status: 500 });
  }
}