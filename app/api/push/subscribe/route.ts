import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const subscription = await request.json();

    // Salva a inscrição (dispositivo) atrelada ao seu usuário no banco
    await prisma.pushSubscription.create({
      data: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return NextResponse.json({ message: "Dispositivo registrado com sucesso!" }, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar inscrição:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}