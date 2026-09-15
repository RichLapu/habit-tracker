import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  // Estendemos a sessão padrão para incluir o 'id'
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}