import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import {
  parsePeriod,
  parseScope,
  periodStart,
} from "@/lib/data-filters";
import { formatDateInput } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

const exportSchema = z.object({
  tipo: z.enum(["sessoes", "questoes"]),
  period: z.string().optional(),
  scope: z.string().optional(),
  subject: z.string().optional(),
});

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function csvResponse(filename: string, rows: (string | number | null)[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const parsed = exportSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Filtros inválidos." }, { status: 400 });
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }

  const membership = await prisma.examMembership.findFirst({
    where: { userId: currentUser.id },
    orderBy: { createdAt: "asc" },
    include: { exam: true },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Espaço de estudos não encontrado." },
      { status: 404 },
    );
  }

  const period = parsePeriod(parsed.data.period);
  const scope = parseScope(parsed.data.scope);
  const start = periodStart(period);
  const subject = parsed.data.subject
    ? await prisma.subject.findFirst({
        where: {
          id: parsed.data.subject,
          examId: membership.examId,
        },
        select: { id: true },
      })
    : null;
  const commonWhere = {
    examId: membership.examId,
    ...(scope === "mine" ? { userId: currentUser.id } : {}),
    ...(subject ? { subjectId: subject.id } : {}),
  };

  if (parsed.data.tipo === "sessoes") {
    const sessions = await prisma.studySession.findMany({
      where: {
        ...commonWhere,
        ...(start ? { studiedAt: { gte: start } } : {}),
      },
      orderBy: [{ studiedAt: "desc" }, { createdAt: "desc" }],
      include: { user: true, subject: true },
    });

    return csvResponse("estuda2-sessoes.csv", [
      ["Data", "Pessoa", "Matéria", "Duração (min)", "Anotações"],
      ...sessions.map((session) => [
        formatDateInput(session.studiedAt),
        session.user.name,
        session.subject.name,
        session.durationMinutes,
        session.notes,
      ]),
    ]);
  }

  const logs = await prisma.questionLog.findMany({
    where: {
      ...commonWhere,
      ...(start ? { answeredAt: { gte: start } } : {}),
    },
    orderBy: [{ answeredAt: "desc" }, { createdAt: "desc" }],
    include: { user: true, subject: true },
  });

  return csvResponse("estuda2-questoes.csv", [
    [
      "Data",
      "Pessoa",
      "Matéria",
      "Questões",
      "Acertos",
      "Aproveitamento (%)",
      "Anotações",
    ],
    ...logs.map((log) => [
      formatDateInput(log.answeredAt),
      log.user.name,
      log.subject.name,
      log.questionsAnswered,
      log.correctAnswers,
      Math.round((log.correctAnswers / log.questionsAnswered) * 100),
      log.notes,
    ]),
  ]);
}
