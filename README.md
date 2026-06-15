# Estuda2

Aplicacao full stack para acompanhar estudos de concurso em dupla.

## Requisitos

- Node.js 20 ou superior
- npm
- PostgreSQL 16 ou Docker

## Executando localmente

1. Instale as dependencias:

   ```bash
   npm install
   ```

2. Copie e ajuste as variaveis de ambiente:

   ```bash
   cp .env.example .env
   ```

3. Inicie o PostgreSQL com Docker:

   ```bash
   docker compose up -d
   ```

4. Prepare o banco:

   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. Inicie a aplicacao:

   ```bash
   npm run dev
   ```

Acesse [http://localhost:3000](http://localhost:3000).

Quando `APP_PASSWORD` estiver definida, o app exige autenticação. `APP_LOGIN`
é opcional; quando definido, login e senha são obrigatórios. Use em produção
valores fortes e um `AUTH_SECRET` diferente.

## Scripts

- `npm run dev`: inicia o servidor de desenvolvimento.
- `npm run build`: gera o build de producao.
- `npm run lint`: executa o ESLint.
- `npm run db:generate`: gera o Prisma Client.
- `npm run db:push`: aplica o schema no banco local.
- `npm run db:seed`: popula os dados iniciais.

## Producao

O projeto esta preparado para deploy na Vercel com PostgreSQL. Configure
`DATABASE_URL`, `APP_LOGIN`, `APP_PASSWORD` e `AUTH_SECRET` no ambiente de
producao, aplique as migracoes com `npx prisma migrate deploy` e execute o seed
uma vez.
