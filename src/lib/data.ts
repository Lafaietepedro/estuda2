import { prisma } from "@/lib/prisma";

export async function getWorkspace() {
  const exam = await prisma.exam.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      memberships: {
        orderBy: { createdAt: "asc" },
        include: { user: true },
      },
      subjects: {
        orderBy: [{ position: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!exam) {
    throw new Error(
      "O espaço de estudos ainda não foi configurado. Execute o seed do banco.",
    );
  }

  return exam;
}
