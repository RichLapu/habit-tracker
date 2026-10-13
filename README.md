# 🚀 Habit Tracker 

Um aplicativo moderno e gamificado para rastreamento de hábitos diários. Transforme sua rotina em um jogo: complete hábitos, ganhe experiência (XP), suba de nível, mantenha suas ofensivas (streaks) ativas e nunca mais esqueça de uma tarefa com o sistema de alarmes e notificações push.

## ✨ Funcionalidades

* **Gestão de Hábitos:** Crie, edite, pause ou exclua hábitos facilmente.
* **🎮 Gamificação (XP e Níveis):** Ganhe 10 XP a cada hábito concluído e suba de nível. Cuidado: desmarcar um hábito faz você perder XP!
* **🔥 Sistema de Ofensivas (Streaks):** Acompanhe quantos dias seguidos você manteve o hábito. Ganhe emblemas especiais aos 7 e 30 dias.
* **📊 Visualização de Progresso:** Acompanhe seu desempenho através de um Heatmap de 30 dias e gráficos de progresso.
* **⏰ Alarmes e Notificações Push:** 
  * Alarmes visuais in-app com opções de soneca (5 min, 15 min) ou conclusão imediata.
  * Notificações Push nativas do sistema operacional (suporte a Web Push via Service Workers).
* **🎨 Personalização:** Defina dias específicos da semana, horários de lembrete, cores temáticas e categorias (Saúde, Estudos, Trabalho, etc.).
* **🔐 Autenticação Segura:** Login via Credenciais (Email/Senha com indicador de força), Google e GitHub (powered by NextAuth).
* **🌓 Tema Claro / Escuro:** Suporte nativo a Dark Mode integrado ao sistema do usuário.
* **📥 Exportação de Dados:** Exporte todo o seu progresso para planilhas do Excel.

## 🛠️ Tecnologias Utilizadas

* **Frontend:** [Next.js](https://nextjs.org/) (App Router), [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
* **Backend:** Next.js API Routes
* **Banco de Dados:** [Prisma ORM](https://www.prisma.io/) (PostgreSQL / MySQL / SQLite)
* **Autenticação:** [NextAuth.js](https://next-auth.js.org/)
* **Ícones:** [Lucide React](https://lucide.dev/)
* **Notificações:** Web Push API & Service Workers

## 🚀 Como rodar o projeto localmente

### Pré-requisitos
* Node.js (v18 ou superior)
* Um banco de dados relacional (PostgreSQL, MySQL) ou SQLite local.
* Chaves VAPID (para notificações push).

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/RichLapu/seu-repositorio-habit-tracker.git](https://github.com/RichLapu/seu-repositorio-habit-tracker.git)
   cd seu-repositorio-habit-tracker
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configuração das Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto e preencha com as seguintes chaves:

   ```env
   # Banco de Dados
   DATABASE_URL="postgresql://user:password@localhost:5432/habittracker?schema=public"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="gere_uma_chave_secreta_aqui"

   # OAuth (Opcional - Para login com Google e GitHub)
   GOOGLE_CLIENT_ID="seu_client_id"
   GOOGLE_CLIENT_SECRET="seu_client_secret"
   GITHUB_CLIENT_ID="seu_client_id"
   GITHUB_CLIENT_SECRET="seu_client_secret"

   # Web Push Notifications (Gere usando: npx web-push generate-vapid-keys)
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="sua_chave_publica"
   VAPID_PRIVATE_KEY="sua_chave_privada"
   ```

4. **Prepare o Banco de Dados:**
   Gere o cliente do Prisma e sincronize o banco de dados:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

6. **Acesse a aplicação:**
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📱 Suporte a PWA e Notificações

Para que as notificações push funcionem corretamente, garanta que o Service Worker está sendo registrado e que você aceitou a permissão de notificações no seu navegador clicando no ícone do sino (`🔔`) no cabeçalho da aplicação.

## 👨‍💻 Autor

Desenvolvido por **Richard Lapuente**
* LinkedIn: [Richard Lapuente](https://www.linkedin.com/in/richard-lapuente/)
* GitHub: [@RichLapu](https://github.com/RichLapu)

## 📝 Licença

Este projeto está sob a licença MIT. Sinta-se livre para usá-lo e modificá-lo.