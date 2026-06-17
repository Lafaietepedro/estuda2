# Estuda2

Aplicação full stack para acompanhar estudos de concurso em dupla, com registro de sessões, questões, tópicos do edital, planejamento de revisões, relatórios e comparativo entre participantes.

O objetivo do Estuda2 é resolver um problema simples e recorrente: duas pessoas estudando para o mesmo concurso precisam enxergar rotina, constância e desempenho sem depender de planilhas soltas.

![Dashboard do Estuda2](screenshots/linkedin/02-dashboard-desktop.png)

## Sumário

- [Destaques](#destaques)
- [Screenshots](#screenshots)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Modelo de dados](#modelo-de-dados)
- [Como rodar localmente](#como-rodar-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts disponíveis](#scripts-disponíveis)
- [Qualidade e testes](#qualidade-e-testes)
- [Deploy](#deploy)
- [Roadmap](#roadmap)

## Destaques

- App full stack com Next.js App Router, Server Components e Server Actions.
- Autenticação simples por login e senha, com sessão por cookie assinado.
- Prisma ORM com PostgreSQL, migrations versionadas e seed inicial.
- Formulários tipados com React Hook Form, Zod e tratamento de erro.
- Dashboard com metas, métricas semanais e próximos passos.
- Relatórios por período, autoria e matéria, com exportação CSV.
- UI responsiva mobile-first com navegação desktop e mobile.
- Organização de edital por matérias e tópicos hierárquicos.
- Planejamento individual com estudos, revisões automáticas e conclusão de tarefas.

## Screenshots

As imagens abaixo foram capturadas com dados demonstrativos para mostrar o fluxo principal do produto.

| Dashboard | Relatórios |
| --- | --- |
| ![Dashboard desktop](screenshots/linkedin/02-dashboard-desktop.png) | ![Relatórios desktop](screenshots/linkedin/05-relatorios-desktop.png) |

| Comparativo | Mobile |
| --- | --- |
| ![Comparativo desktop](screenshots/linkedin/06-comparativo-desktop.png) | ![Dashboard mobile](screenshots/linkedin/08-dashboard-mobile.png) |

Outras capturas estão em [`screenshots/linkedin`](screenshots/linkedin).

## Funcionalidades

### Acesso e espaço da dupla

- Login local com credenciais geradas no seed.
- Middleware protegendo as rotas internas.
- Dois participantes por espaço de estudo.
- Responsável do espaço com permissão para alterar configurações compartilhadas.

### Dashboard

- Saudação personalizada para o usuário atual.
- Resumo semanal individual e da dupla.
- Meta semanal da dupla e meta individual.
- Contagem regressiva para a data da prova.
- Gráfico simples de ritmo dos últimos 7 dias.
- Atalhos para registrar estudo, registrar questões e planejar atividades.

### Matérias e edital

- Cadastro, edição, ordenação, arquivamento e exclusão segura de matérias.
- Metas semanais por matéria.
- Tópicos do edital vinculados a matérias.
- Hierarquia de tópicos com tópico pai e subtópicos.
- Histórico preservado ao arquivar matérias ou tópicos.

### Sessões de estudo

- Registro de data, duração, matéria, tópico e anotações.
- Histórico filtrável por período, autoria e matéria.
- Edição e exclusão apenas dos próprios registros.
- Geração opcional de revisões automáticas a partir de uma sessão.

### Questões

- Registro de questões resolvidas, acertos, matéria, tópico e anotações.
- Cálculo de aproveitamento.
- Histórico com edição e exclusão dos próprios registros.
- Exportação CSV respeitando os filtros ativos.

### Planejamento e revisões

- Agenda individual de estudos e revisões.
- Itens com data, duração prevista, matéria, tópico e observações.
- Marcação de atividade como concluída ou reaberta.
- Revisões automáticas configuráveis, por exemplo `1,7,30` dias após o estudo.

### Relatórios e comparativo

- Indicadores de tempo estudado, sessões, questões e aproveitamento.
- Distribuição por matéria e por tópico.
- Filtros por período, autoria e matéria.
- Comparativo transparente entre os dois participantes, sem ranking agressivo.
- Exportação CSV de sessões e questões.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 15 |
| Linguagem | TypeScript |
| UI | React 19, Tailwind CSS, shadcn/ui, Radix UI, Lucide React |
| Formulários | React Hook Form, Zod |
| Dados | Prisma ORM, PostgreSQL |
| Visualização de dados | Visualizações customizadas; Recharts disponível para evolução dos gráficos |
| Qualidade | ESLint, TypeScript strict, Node test runner |

## Arquitetura

```text
src/
  app/
    (app)/              Rotas autenticadas do produto
    entrar/             Tela de login
    exportar/           Endpoint CSV
    actions.ts          Server Actions de escrita
  components/           Componentes reutilizáveis de UI e formulário
  lib/                  Acesso a dados, autenticação, datas, filtros e regras
  middleware.ts         Proteção de rotas autenticadas
prisma/
  schema.prisma         Schema relacional
  migrations/           Histórico de migrations
  seed.ts               Dados iniciais
tests/
  reviews.test.ts       Testes de regras de revisão
```

### Decisões técnicas

- Server Components por padrão para páginas de leitura e agregações.
- Client Components apenas para interação local, estado de formulário e navegação mobile.
- Server Actions concentrando validação, autorização e persistência.
- Prisma Client isolado em `src/lib/prisma.ts`.
- Datas normalizadas para reduzir problemas de fuso horário em registros locais.
- Exportações CSV feitas no backend para evitar expor regras de filtro no cliente.

## Modelo de dados

Entidades principais:

- `User`: participante com login, senha hash e registros individuais.
- `Exam`: concurso/objetivo compartilhado pela dupla.
- `ExamMembership`: vínculo entre usuário e concurso, com papel e meta individual.
- `Subject`: matéria do concurso, com cor, posição e meta semanal.
- `Topic`: tópico do edital, com suporte a hierarquia.
- `StudySession`: sessão de estudo registrada por usuário.
- `QuestionLog`: registro de questões e acertos.
- `StudyPlanItem`: estudo ou revisão planejada.

Relação simplificada:

```text
Exam
  ├─ ExamMembership ─ User
  ├─ Subject
  │   └─ Topic
  ├─ StudySession
  ├─ QuestionLog
  └─ StudyPlanItem
```

## Como rodar localmente

### Pré-requisitos

- Node.js 20 ou superior.
- npm.
- PostgreSQL 16 local ou Docker.

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Para um ambiente local rápido, você pode usar:

```env
DATABASE_URL="postgresql://estuda2:estuda2@localhost:5432/estuda2?schema=public"
APP_LOGIN="dev"
APP_PASSWORD="dev"
AUTH_SECRET="dev-local-secret"
```

Em qualquer ambiente compartilhado ou público, troque `APP_PASSWORD` e `AUTH_SECRET` por valores fortes.

### 3. Suba o PostgreSQL

Com Docker:

```bash
docker compose up -d
```

Ou use um PostgreSQL local já instalado, desde que a `DATABASE_URL` aponte para um banco válido.

### 4. Prepare o banco

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

O seed cria:

- um concurso inicial;
- duas contas de usuário;
- vínculo da dupla com o concurso;
- matérias iniciais.

Com as variáveis acima, os logins serão:

| Usuário | Login | Senha |
| --- | --- | --- |
| Responsável | `dev` | `dev` |
| Segundo integrante | `dev2` | `dev` |

Se `APP_LOGIN` for alterado, a segunda conta recebe o sufixo `-2`.

### 5. Rode o app

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | URL de conexão PostgreSQL usada pelo Prisma. |
| `APP_LOGIN` | Não | Login inicial do responsável criado pelo seed. Padrão: `dev`. |
| `APP_PASSWORD` | Não | Senha inicial das contas criadas pelo seed. Padrão interno: `dev`. |
| `AUTH_SECRET` | Recomendado | Chave usada para assinar/verificar a sessão local. Use um valor forte fora do desenvolvimento. |

## Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento. |
| `npm run build` | Gera o Prisma Client e cria o build de produção. |
| `npm run start` | Inicia o app após o build. |
| `npm run lint` | Executa o ESLint. |
| `npm run test` | Executa os testes com o runner nativo do Node. |
| `npm run db:generate` | Gera o Prisma Client. |
| `npm run db:push` | Sincroniza o schema com o banco local. |
| `npm run db:seed` | Executa o seed. |
| `npm run db:studio` | Abre o Prisma Studio. |

## Qualidade e testes

Comandos recomendados antes de abrir PR ou publicar alterações:

```bash
npm run lint
npm run test
npm run build
```

Também é útil validar o banco:

```bash
npx prisma generate
npx prisma db push
```

Cobertura atual:

- validação de regras de revisão automática;
- lint de TypeScript/React/Next;
- checagem de tipos no build do Next;
- validação dos schemas Prisma durante `generate` e `db push`.

## Deploy

O projeto está preparado para deploy em plataformas como Vercel, usando PostgreSQL gerenciado.

Checklist sugerido:

1. Criar banco PostgreSQL em produção.
2. Configurar `DATABASE_URL`.
3. Configurar `APP_LOGIN`, `APP_PASSWORD` e `AUTH_SECRET`.
4. Executar migrations:

   ```bash
   npx prisma migrate deploy
   ```

5. Executar o seed uma vez, se o ambiente ainda estiver vazio:

   ```bash
   npx prisma db seed
   ```

6. Rodar o build:

   ```bash
   npm run build
   ```

## Roadmap

Ideias naturais para evolução:

- autenticação com recuperação de senha;
- múltiplos concursos por dupla;
- convites para novos participantes;
- gráficos mais avançados com Recharts;
- metas por ciclo de estudo;
- upload/importação de edital;
- testes end-to-end dos fluxos principais;
- modo escuro.

## Licença

Projeto privado no momento. Ajuste esta seção caso o repositório seja publicado como open source.
