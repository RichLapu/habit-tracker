import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { endpoint } = await request.json();
    
    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint ausente" }, { status: 400 });
    }

    // Deleta este aparelho específico do banco de dados da AWS
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: endpoint }
    });

    return NextResponse.json({ message: "Notificações desativadas para este aparelho." });
  } catch (error) {
    console.error("Erro ao remover inscrição:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}