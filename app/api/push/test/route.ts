import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import webpush from "web-push";

// Configura as suas chaves mágicas
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { title, message } = await request.json();

    // Busca todos os dispositivos logados na sua conta
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id }
    });

    const payload = JSON.stringify({ title, body: message });

    // Dispara a notificação para todos os seus PCs e celulares
    for (const sub of subscriptions) {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      }, payload).catch(err => console.error("Erro no envio do push:", err));
    }

    return NextResponse.json({ message: "Push enviado!" });
  } catch (error) {
    console.error("Erro no push:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}