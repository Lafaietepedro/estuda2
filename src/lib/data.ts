import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function getWorkspace() {
  const currentUser = await requireCurrentUser();
  const exam = await prisma.exam.findFirst({
    where: {
      memberships: {
        some: { userId: currentUser.id },
      },
    },
    orderBy: { createdAt: "asc" },
    include: {
      memberships: {
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
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

  const currentMembership = exam.memberships.find(
    (membership) => membership.userId === currentUser.id,
  );
  if (!currentMembership) {
    throw new Error("Você não participa deste espaço de estudos.");
  }

  return { ...exam, currentUser, currentMembership };
}
