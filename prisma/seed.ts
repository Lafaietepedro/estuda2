import { ExamRole, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const subjects = [
  { name: "Língua Portuguesa", color: "#7C3AED", position: 1 },
  { name: "Direito Constitucional", color: "#2563EB", position: 2 },
  { name: "Direito Administrativo", color: "#0891B2", position: 3 },
  { name: "Raciocínio Lógico", color: "#EA580C", position: 4 },
  { name: "Informática", color: "#16A34A", position: 5 },
  { name: "Redação", color: "#DB2777", position: 6 },
];

async function main() {
  const [ana, bruno] = await Promise.all([
    prisma.user.upsert({
      where: { email: "ana.martins@estuda2.local" },
      update: { name: "Ana Martins" },
      create: {
        name: "Ana Martins",
        email: "ana.martins@estuda2.local",
      },
    }),
    prisma.user.upsert({
      where: { email: "bruno.costa@estuda2.local" },
      update: { name: "Bruno Costa" },
      create: {
        name: "Bruno Costa",
        email: "bruno.costa@estuda2.local",
      },
    }),
  ]);

  const exam = await prisma.exam.upsert({
    where: { slug: "trf-analista-judiciario" },
    update: {
      name: "Tribunal Regional Federal",
      description: "Preparação em dupla para Analista Judiciário.",
    },
    create: {
      name: "Tribunal Regional Federal",
      slug: "trf-analista-judiciario",
      description: "Preparação em dupla para Analista Judiciário.",
    },
  });

  await Promise.all([
    prisma.examMembership.upsert({
      where: {
        userId_examId: {
          userId: ana.id,
          examId: exam.id,
        },
      },
      update: { role: ExamRole.OWNER },
      create: {
        userId: ana.id,
        examId: exam.id,
        role: ExamRole.OWNER,
      },
    }),
    prisma.examMembership.upsert({
      where: {
        userId_examId: {
          userId: bruno.id,
          examId: exam.id,
        },
      },
      update: { role: ExamRole.MEMBER },
      create: {
        userId: bruno.id,
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

