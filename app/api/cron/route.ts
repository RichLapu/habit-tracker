import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(request: Request) {
  try {
    // 1. Segurança: Garante que só a Vercel ou nós (com a senha) podemos rodar isso
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Pega a hora exata agora no Brasil (Fuso horário de Brasília/Rio Grande)
    const spTime = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const nowSP = new Date(spTime);
    const currentHourMin = nowSP.getHours().toString().padStart(2, '0') + ':' + nowSP.getMinutes().toString().padStart(2, '0');

    // 3. Busca no banco todos os hábitos que tenham algum horário cadastrado
    const habits = await prisma.habit.findMany({
      where: { reminderTimes: { not: null } },
      include: {
        user: { include: { subscriptions: true } },
        logs: true
      }
    });

    let notificationsSent = 0;

    for (const habit of habits) {
      // Ignora se a hora atual não bater com os horários do hábito
      if (!habit.reminderTimes?.split(',').includes(currentHourMin)) continue;

      // Verifica se já foi feito hoje
      const isCompleted = habit.logs.some(log => {
        const logDate = new Date(log.date);
        return logDate.getDate() === nowSP.getDate() && logDate.getMonth() === nowSP.getMonth();
      });

      if (!isCompleted && habit.user.subscriptions.length > 0) {
        // Dispara para todos os aparelhos (PCs/Celulares) que o usuário cadastrou
        for (const sub of habit.user.subscriptions) {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          }, JSON.stringify({
            title: `Hora do Hábito: ${habit.title}`,
            body: "Não quebre sua ofensiva! Clique aqui para concluir."
          })).catch(err => console.error("Erro no push:", err));
          
          notificationsSent++;
        }
      }
    }

    return NextResponse.json({ message: "Cron executado", sent: notificationsSent });
  } catch (error) {
    console.error("Erro no Cron:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}