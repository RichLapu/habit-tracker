import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, xp: true, level: true }
    });

    return NextResponse.json({
      name: user?.name || session.user.name,
      xp: user?.xp || 0,
      level: user?.level || 1
    });
  } catch (error) {
    return new NextResponse("Erro ao buscar dados do usuário", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });
    
    const { name } = await req.json();
    
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name }
    });

    return NextResponse.json({ success: true, name: updatedUser.name });
  } catch (error) {
    return new NextResponse("Erro ao atualizar perfil", { status: 500 });
  }
}