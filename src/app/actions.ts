"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { z } from "zod";

import { getWorkspace } from "@/lib/data";
import { parseLocalDate } from "@/lib/dates";
import type { FormState } from "@/lib/form-state";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().min(1, "Selecione uma opção.");
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.");

function errorState(error: z.ZodError): FormState {
  return {
    status: "error",
    message: "Revise os campos destacados.",
    errors: error.flatten().fieldErrors,
  };
}

async function validateWorkspaceSelection(userId: string, subjectId: string) {
  const workspace = await getWorkspace();
  const userIsMember = workspace.memberships.some(
    (membership) => membership.userId === userId,
  );
  const subjectBelongsToExam = workspace.subjects.some(
    (subject) => subject.id === subjectId,
  );

  if (!userIsMember || !subjectBelongsToExam) {
    throw new Error("Usuário ou matéria inválidos.");
  }

  return workspace;
}

const studySessionSchema = z.object({
  userId: idSchema,
  subjectId: idSchema,
  studiedAt: dateSchema,
  durationMinutes: z.coerce
    .number()
    .int("Use minutos inteiros.")
    .min(1, "Informe pelo menos 1 minuto.")
    .max(1440, "A duração máxima é de 24 horas."),
  notes: z.string().trim().max(500, "Use no máximo 500 caracteres.").optional(),
});

export async function createStudySession(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = studySessionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(parsed.error);

  try {
    const workspace = await validateWorkspaceSelection(
      parsed.data.userId,
      parsed.data.subjectId,
    );

    await prisma.studySession.create({
      data: {
        userId: parsed.data.userId,
        subjectId: parsed.data.subjectId,
        examId: workspace.id,
        studiedAt: parseLocalDate(parsed.data.studiedAt),
        durationMinutes: parsed.data.durationMinutes,
        notes: parsed.data.notes || null,
      },
    });

    revalidatePath("/");
    revalidatePath("/sessoes");
    revalidatePath("/materias");
    revalidatePath("/relatorios");
    revalidatePath("/comparativo");
    return { status: "success", message: "Sessão registrada." };
  } catch {
    return {
      status: "error",
      message: "Não foi possível registrar a sessão. Tente novamente.",
    };
  }
}

const questionLogSchema = z
  .object({
    userId: idSchema,
    subjectId: idSchema,
    answeredAt: dateSchema,
    questionsAnswered: z.coerce
      .number()
      .int("Use um número inteiro.")
      .min(1, "Informe pelo menos 1 questão.")
      .max(10000, "Quantidade muito alta."),
    correctAnswers: z.coerce
      .number()
      .int("Use um número inteiro.")
      .min(0, "O número de acertos não pode ser negativo."),
    notes: z.string().trim().max(500, "Use no máximo 500 caracteres.").optional(),
  })
  .refine((data) => data.correctAnswers <= data.questionsAnswered, {
    path: ["correctAnswers"],
    message: "Os acertos não podem superar as questões resolvidas.",
  });

export async function createQuestionLog(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = questionLogSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(parsed.error);

  try {
    const workspace = await validateWorkspaceSelection(
      parsed.data.userId,
      parsed.data.subjectId,
    );

    await prisma.questionLog.create({
      data: {
        userId: parsed.data.userId,
        subjectId: parsed.data.subjectId,
        examId: workspace.id,
        answeredAt: parseLocalDate(parsed.data.answeredAt),
        questionsAnswered: parsed.data.questionsAnswered,
        correctAnswers: parsed.data.correctAnswers,
        notes: parsed.data.notes || null,
      },
    });

    revalidatePath("/");
    revalidatePath("/questoes");
    revalidatePath("/materias");
    revalidatePath("/relatorios");
    revalidatePath("/comparativo");
    return { status: "success", message: "Questões registradas." };
  } catch {
    return {
      status: "error",
      message: "Não foi possível registrar as questões. Tente novamente.",
    };
  }
}

const subjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome da matéria.")
    .max(80, "Use no máximo 80 caracteres."),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Escolha uma cor válida."),
});

export async function createSubject(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = subjectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(parsed.error);

  try {
    const workspace = await getWorkspace();
    const lastSubject = workspace.subjects.at(-1);

    await prisma.subject.create({
      data: {
        examId: workspace.id,
        name: parsed.data.name,
        color: parsed.data.color,
        position: (lastSubject?.position ?? 0) + 1,
      },
    });

    revalidatePath("/");
    revalidatePath("/materias");
    revalidatePath("/sessoes");
    revalidatePath("/questoes");
    return { status: "success", message: "Matéria adicionada." };
  } catch {
    return {
      status: "error",
      message: "Essa matéria já existe ou não pôde ser adicionada.",
    };
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function deleteStudySession(formData: FormData) {
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  await prisma.studySession.deleteMany({ where: { id: parsed.data.id } });
  revalidatePath("/");
  revalidatePath("/sessoes");
  revalidatePath("/materias");
  revalidatePath("/relatorios");
  revalidatePath("/comparativo");
}

export async function deleteQuestionLog(formData: FormData) {
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  await prisma.questionLog.deleteMany({ where: { id: parsed.data.id } });
  revalidatePath("/");
  revalidatePath("/questoes");
  revalidatePath("/materias");
  revalidatePath("/relatorios");
  revalidatePath("/comparativo");
}

const settingsSchema = z.object({
  examName: z
    .string()
    .trim()
    .min(2, "Informe o nome do concurso.")
    .max(100, "Use no máximo 100 caracteres."),
  description: z.string().trim().max(240, "Use no máximo 240 caracteres."),
  examDate: z.union([dateSchema, z.literal("")]),
  firstUserId: z.string().min(1),
  firstUserName: z
    .string()
    .trim()
    .min(2, "Informe o primeiro nome.")
    .max(60, "Use no máximo 60 caracteres."),
  secondUserId: z.string().min(1),
  secondUserName: z
    .string()
    .trim()
    .min(2, "Informe o segundo nome.")
    .max(60, "Use no máximo 60 caracteres."),
});

export async function updateSettings(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(parsed.error);

  try {
    const workspace = await getWorkspace();
    const validUserIds = new Set(
      workspace.memberships.map((membership) => membership.userId),
    );

    if (
      !validUserIds.has(parsed.data.firstUserId) ||
      !validUserIds.has(parsed.data.secondUserId)
    ) {
      throw new Error("Usuários inválidos.");
    }

    await prisma.$transaction([
      prisma.exam.update({
        where: { id: workspace.id },
        data: {
          name: parsed.data.examName,
          description: parsed.data.description || null,
          examDate: parsed.data.examDate
            ? parseLocalDate(parsed.data.examDate)
            : null,
        },
      }),
      prisma.user.update({
        where: { id: parsed.data.firstUserId },
        data: { name: parsed.data.firstUserName },
      }),
      prisma.user.update({
        where: { id: parsed.data.secondUserId },
        data: { name: parsed.data.secondUserName },
      }),
    ]);

    revalidatePath("/", "layout");
    return { status: "success", message: "Configurações salvas." };
  } catch {
    return {
      status: "error",
      message: "Não foi possível salvar as configurações.",
    };
  }
}

function sessionToken() {
  const password = process.env.APP_PASSWORD ?? "";
  const secret = process.env.AUTH_SECRET ?? "";
  return createHash("sha256").update(`${password}:${secret}`).digest("hex");
}

export async function login(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({ password: z.string().min(1, "Informe a senha.") })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return errorState(parsed.error);
  if (!process.env.APP_PASSWORD || parsed.data.password !== process.env.APP_PASSWORD) {
    return { status: "error", message: "Senha incorreta." };
  }

  const cookieStore = await cookies();
  cookieStore.set("estuda2_session", sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("estuda2_session");
  redirect("/entrar");
}
