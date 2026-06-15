import { ExamRole, PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/passwords";

const prisma = new PrismaClient();
const firstLogin = (process.env.APP_LOGIN || "dev").trim().toLowerCase();
const secondLogin = firstLogin === "dev" ? "dev2" : `${firstLogin}-2`;
const initialPassword = process.env.APP_PASSWORD || "dev";

const subjects = [
  { name: "Língua Portuguesa", color: "#7C3AED", position: 1 },
  { name: "Direito Constitucional", color: "#2563EB", position: 2 },
  { name: "Direito Administrativo", color: "#0891B2", position: 3 },
  { name: "Raciocínio Lógico", color: "#EA580C", position: 4 },
  { name: "Informática", color: "#16A34A", position: 5 },
  { name: "Redação", color: "#DB2777", position: 6 },
];

async function main() {
  const [firstUser, secondUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: "pessoa1@estuda2.local" },
      update: {},
      create: {
        name: "Pessoa 1",
        email: "pessoa1@estuda2.local",
        login: firstLogin,
        passwordHash: hashPassword(initialPassword),
      },
    }),
    prisma.user.upsert({
      where: { email: "pessoa2@estuda2.local" },
      update: {},
      create: {
        name: "Pessoa 2",
        email: "pessoa2@estuda2.local",
        login: secondLogin,
        passwordHash: hashPassword(initialPassword),
      },
    }),
  ]);

  const exam = await prisma.exam.upsert({
    where: { slug: "nosso-concurso" },
    update: {},
    create: {
      name: "Nosso concurso",
      slug: "nosso-concurso",
      description: "Preparação em dupla.",
    },
  });

  await Promise.all([
    prisma.examMembership.upsert({
      where: {
        userId_examId: {
          userId: firstUser.id,
          examId: exam.id,
        },
      },
      update: { role: ExamRole.OWNER },
      create: {
        userId: firstUser.id,
        examId: exam.id,
        role: ExamRole.OWNER,
      },
    }),
    prisma.examMembership.upsert({
      where: {
        userId_examId: {
          userId: secondUser.id,
          examId: exam.id,
        },
      },
      update: { role: ExamRole.MEMBER },
      create: {
        userId: secondUser.id,
        examId: exam.id,
        role: ExamRole.MEMBER,
      },
    }),
    ...subjects.map((subject) =>
      prisma.subject.upsert({
        where: {
          examId_name: {
            examId: exam.id,
            name: subject.name,
          },
        },
        update: {
          color: subject.color,
          position: subject.position,
        },
        create: {
          ...subject,
          examId: exam.id,
        },
      }),
    ),
  ]);

  console.info("Seed concluído: concurso, dupla e matérias criados.");
}

main()
  .catch((error) => {
    console.error("Falha ao executar o seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
