import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(
    cookieStore.get(SESSION_COOKIE)?.value,
  );
  if (!session) return null;

  return prisma.user.findUnique({ where: { id: session.userId } });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return user;
}
