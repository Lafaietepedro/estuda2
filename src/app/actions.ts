"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ExamRole, PlanItemKind, Prisma } from "@prisma/client";
import { z } from "zod";

import { getWorkspace } from "@/lib/data";
import { parseLocalDate } from "@/lib/dates";
import type { FormState } from "@/lib/form-state";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";

const idSchema = z.string().min(1, "Selecione uma opção.");
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.");
const optionalWeeklyGoalSchema = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.coerce
    .number()
    .int("Use minutos inteiros.")
    .min(1, "Informe pelo menos 1 minuto.")
    .max(10080, "A meta não pode superar uma semana inteira.")
    .nullable(),
);
const optionalPasswordSchema = z
  .string()
  .refine((value) => !value || value.length >= 6, {
    message: "Use pelo menos 6 caracteres.",
  })
  .optional();

function errorState(error: z.ZodError): FormState {
  return {
    status: "error",
    message: "Revise os campos destacados.",
    errors: error.flatten().fieldErrors,
  };
}

function revalidateRecords() {
  revalidatePath("/");
  revalidatePath("/sessoes");
  revalidatePath("/questoes");
  revalidatePath("/materias");
  revalidatePath("/relatorios");
  revalidatePath("/comparativo");
  revalidatePath("/planejamento");
}

async function requireOwner() {
  const workspace = await getWorkspace();
  if (workspace.currentMembership.role !== ExamRole.OWNER) {
    throw new Error("Apenas o responsável pode alterar esta configuração.");
  }
  return workspace;
}

async function validateActiveSubject(subjectId: string) {
  const workspace = await getWorkspace();
  const subject = workspace.subjects.find(
    (item) => item.id === subjectId && !item.archivedAt,
  );
  if (!subject) throw new Error("Matéria inválida ou arquivada.");
  return workspace;
}

const studySessionSchema = z.object({
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
    const workspace = await validateActiveSubject(parsed.data.subjectId);
    await prisma.studySession.create({
      data: {
        userId: workspace.currentUser.id,
        subjectId: parsed.data.subjectId,
        examId: workspace.id,
        studiedAt: parseLocalDate(parsed.data.studiedAt),
        durationMinutes: parsed.data.durationMinutes,
        notes: parsed.data.notes || null,
      },
    });
    revalidateRecords();
    return { status: "success", message: "Sessão registrada." };
  } catch {
    return {
      status: "error",
      message: "Não foi possível registrar a sessão. Tente novamente.",
    };
  }
}

const updateStudySessionSchema = studySessionSchema.extend({
  id: z.string().min(1),
});

export async function updateStudySession(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = updateStudySessionSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return errorState(parsed.error);

  try {
    const workspace = await getWorkspace();
    const session = await prisma.studySession.findFirst({
      where: {
        id: parsed.data.id,
        examId: workspace.id,
        userId: workspace.currentUser.id,
      },
    });
    if (!session) throw new Error("Sessão não encontrada.");

    const subject = workspace.subjects.find(
      (item) => item.id === parsed.data.subjectId,
    );
    if (
      !subject ||
      (subject.archivedAt && subject.id !== session.subjectId)
    ) {
      throw new Error("Matéria inválida ou arquivada.");
    }

    await prisma.studySession.update({
      where: { id: session.id },
      data: {
        subjectId: parsed.data.subjectId,
        studiedAt: parseLocalDate(parsed.data.studiedAt),
        durationMinutes: parsed.data.durationMinutes,
        notes: parsed.data.notes || null,
      },
    });
    revalidateRecords();
    return { status: "success", message: "Sessão atualizada." };
  } catch {
    return {
      status: "error",
      message: "Você só pode editar suas próprias sessões.",
    };
  }
}

const questionLogSchema = z
  .object({
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
    notes: z
      .string()
      .trim()
      .max(500, "Use no máximo 500 caracteres.")
      .optional(),
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
    const workspace = await validateActiveSubject(parsed.data.subjectId);
    await prisma.questionLog.create({
      data: {
        userId: workspace.currentUser.id,
        subjectId: parsed.data.subjectId,
        examId: workspace.id,
        answeredAt: parseLocalDate(parsed.data.answeredAt),
        questionsAnswered: parsed.data.questionsAnswered,
        correctAnswers: parsed.data.correctAnswers,
        notes: parsed.data.notes || null,
      },
    });
    revalidateRecords();
    return { status: "success", message: "Questões registradas." };
  } catch {
    return {
      status: "error",
      message: "Não foi possível registrar as questões. Tente novamente.",
    };
  }
}

const updateQuestionLogSchema = questionLogSchema.and(
  z.object({ id: z.string().min(1) }),
);

export async function updateQuestionLog(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = updateQuestionLogSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return errorState(parsed.error);

  try {
    const workspace = await getWorkspace();
    const log = await prisma.questionLog.findFirst({
      where: {
        id: parsed.data.id,
        examId: workspace.id,
        userId: workspace.currentUser.id,
      },
    });
    if (!log) throw new Error("Registro não encontrado.");

    const subject = workspace.subjects.find(
      (item) => item.id === parsed.data.subjectId,
    );
    if (!subject || (subject.archivedAt && subject.id !== log.subjectId)) {
      throw new Error("Matéria inválida ou arquivada.");
    }

    await prisma.questionLog.update({
      where: { id: log.id },
      data: {
        subjectId: parsed.data.subjectId,
        answeredAt: parseLocalDate(parsed.data.answeredAt),
        questionsAnswered: parsed.data.questionsAnswered,
        correctAnswers: parsed.data.correctAnswers,
        notes: parsed.data.notes || null,
      },
    });
    revalidateRecords();
    return { status: "success", message: "Registro atualizado." };
  } catch {
    return {
      status: "error",
      message: "Você só pode editar seus próprios registros.",
    };
  }
}

const planItemSchema = z.object({
  kind: z.nativeEnum(PlanItemKind),
  subjectId: idSchema,
  scheduledFor: dateSchema,
  title: z
    .string()
    .trim()
    .min(2, "Informe o objetivo da atividade.")
    .max(120, "Use no máximo 120 caracteres."),
  estimatedMinutes: z.coerce
    .number()
    .int("Use minutos inteiros.")
    .min(5, "Planeje pelo menos 5 minutos.")
    .max(1440, "A duração máxima é de 24 horas."),
  notes: z.string().trim().max(500, "Use no máximo 500 caracteres.").optional(),
});

export async function createPlanItem(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = planItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(parsed.error);

  try {
    const workspace = await validateActiveSubject(parsed.data.subjectId);
    await prisma.studyPlanItem.create({
      data: {
        kind: parsed.data.kind,
        title: parsed.data.title,
        scheduledFor: parseLocalDate(parsed.data.scheduledFor),
        estimatedMinutes: parsed.data.estimatedMinutes,
        notes: parsed.data.notes || null,
        userId: workspace.currentUser.id,
        examId: workspace.id,
        subjectId: parsed.data.subjectId,
      },
    });
    revalidateRecords();
    return {
      status: "success",
      message:
        parsed.data.kind === PlanItemKind.REVIEW
          ? "Revisão programada."
          : "Estudo programado.",
    };
  } catch {
    return {
      status: "error",
      message: "Não foi possível programar a atividade.",
    };
  }
}

const updatePlanItemSchema = planItemSchema.extend({
  id: z.string().min(1),
});

export async function updatePlanItem(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = updatePlanItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(parsed.error);

  try {
    const workspace = await getWorkspace();
    const item = await prisma.studyPlanItem.findFirst({
      where: {
        id: parsed.data.id,
        examId: workspace.id,
        userId: workspace.currentUser.id,
      },
    });
    if (!item) throw new Error("Atividade não encontrada.");

    const subject = workspace.subjects.find(
      (candidate) => candidate.id === parsed.data.subjectId,
    );
    if (!subject || (subject.archivedAt && subject.id !== item.subjectId)) {
      throw new Error("Matéria inválida ou arquivada.");
    }

    await prisma.studyPlanItem.update({
      where: { id: item.id },
      data: {
        kind: parsed.data.kind,
        title: parsed.data.title,
        scheduledFor: parseLocalDate(parsed.data.scheduledFor),
        estimatedMinutes: parsed.data.estimatedMinutes,
        notes: parsed.data.notes || null,
        subjectId: parsed.data.subjectId,
      },
    });
    revalidateRecords();
    return { status: "success", message: "Planejamento atualizado." };
  } catch {
    return {
      status: "error",
      message: "Você só pode editar suas próprias atividades.",
    };
  }
}

export async function togglePlanItemCompletion(formData: FormData) {
  const parsed = z
    .object({
      id: z.string().min(1),
      completed: z.enum(["true", "false"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const workspace = await getWorkspace();
  await prisma.studyPlanItem.updateMany({
    where: {
      id: parsed.data.id,
      examId: workspace.id,
      userId: workspace.currentUser.id,
    },
    data: {
      completedAt: parsed.data.completed === "true" ? new Date() : null,
    },
  });
  revalidateRecords();
}

export async function deletePlanItem(formData: FormData) {
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const workspace = await getWorkspace();
  await prisma.studyPlanItem.deleteMany({
    where: {
      id: parsed.data.id,
      examId: workspace.id,
      userId: workspace.currentUser.id,
    },
  });
  revalidateRecords();
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
  weeklyGoalMinutes: optionalWeeklyGoalSchema,
});

export async function createSubject(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = subjectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(parsed.error);

  try {
    const workspace = await requireOwner();
    const lastPosition = Math.max(
      0,
      ...workspace.subjects.map((subject) => subject.position),
    );
    await prisma.subject.create({
      data: {
        examId: workspace.id,
        name: parsed.data.name,
        color: parsed.data.color,
        weeklyGoalMinutes: parsed.data.weeklyGoalMinutes,
        position: lastPosition + 1,
      },
    });
    revalidateRecords();
    return { status: "success", message: "Matéria adicionada." };
  } catch {
    return {
      status: "error",
      message: "Essa matéria já existe ou você não pode adicioná-la.",
    };
  }
}

const updateSubjectSchema = subjectSchema.extend({
  id: z.string().min(1),
});

export async function updateSubject(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = updateSubjectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(parsed.error);

  try {
    const workspace = await requireOwner();
    const subject = workspace.subjects.find(
      (item) => item.id === parsed.data.id,
    );
    if (!subject) throw new Error("Matéria não encontrada.");

    await prisma.subject.update({
      where: { id: subject.id },
      data: {
        name: parsed.data.name,
        color: parsed.data.color,
        weeklyGoalMinutes: parsed.data.weeklyGoalMinutes,
      },
    });
    revalidateRecords();
    return { status: "success", message: "Matéria atualizada." };
  } catch {
    return {
      status: "error",
      message: "Não foi possível atualizar a matéria.",
    };
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function deleteStudySession(formData: FormData) {
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const workspace = await getWorkspace();
  await prisma.studySession.deleteMany({
    where: {
      id: parsed.data.id,
      examId: workspace.id,
      userId: workspace.currentUser.id,
    },
  });
  revalidateRecords();
}

export async function deleteQuestionLog(formData: FormData) {
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const workspace = await getWorkspace();
  await prisma.questionLog.deleteMany({
    where: {
      id: parsed.data.id,
      examId: workspace.id,
      userId: workspace.currentUser.id,
    },
  });
  revalidateRecords();
}

export async function toggleSubjectArchive(formData: FormData) {
  const parsed = z
    .object({
      id: z.string().min(1),
      archived: z.enum(["true", "false"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const workspace = await requireOwner();
  await prisma.subject.updateMany({
    where: { id: parsed.data.id, examId: workspace.id },
    data: { archivedAt: parsed.data.archived === "true" ? new Date() : null },
  });
  revalidateRecords();
}

export async function reorderSubject(formData: FormData) {
  const parsed = z
    .object({
      id: z.string().min(1),
      direction: z.enum(["up", "down"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const workspace = await requireOwner();
  const subject = workspace.subjects.find((item) => item.id === parsed.data.id);
  if (!subject) return;

  const ordered = workspace.subjects
    .filter((item) => Boolean(item.archivedAt) === Boolean(subject.archivedAt))
    .sort((first, second) => first.position - second.position);
  const currentIndex = ordered.findIndex((item) => item.id === subject.id);
  const targetIndex =
    parsed.data.direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const target = ordered[targetIndex];
  if (!target) return;

  await prisma.$transaction([
    prisma.subject.update({
      where: { id: subject.id },
      data: { position: target.position },
    }),
    prisma.subject.update({
      where: { id: target.id },
      data: { position: subject.position },
    }),
  ]);
  revalidateRecords();
}

export async function deleteSubject(formData: FormData) {
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const workspace = await requireOwner();
  const subject = await prisma.subject.findFirst({
    where: { id: parsed.data.id, examId: workspace.id },
    include: {
      _count: { select: { studySessions: true, questionLogs: true } },
    },
  });
  if (!subject) return;
  if (subject._count.studySessions + subject._count.questionLogs > 0) {
    throw new Error("Matérias com histórico devem ser arquivadas.");
  }

  await prisma.subject.delete({ where: { id: subject.id } });
  revalidateRecords();
}

const loginNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Use pelo menos 3 caracteres.")
  .max(40, "Use no máximo 40 caracteres.")
  .regex(
    /^[a-z0-9._-]+$/,
    "Use apenas letras, números, ponto, hífen ou sublinhado.",
  );

const settingsSchema = z.object({
  examName: z
    .string()
    .trim()
    .min(2, "Informe o nome do concurso.")
    .max(100, "Use no máximo 100 caracteres."),
  description: z.string().trim().max(240, "Use no máximo 240 caracteres."),
  examDate: z.union([dateSchema, z.literal("")]),
  weeklyGoalMinutes: z.coerce
    .number()
    .int("Use minutos inteiros.")
    .min(1, "Informe pelo menos 1 minuto.")
    .max(10080, "A meta não pode superar uma semana inteira."),
  firstUserId: z.string().min(1),
  firstUserName: z.string().trim().min(2).max(60),
  firstUserLogin: loginNameSchema,
  firstUserPassword: optionalPasswordSchema,
  firstUserWeeklyGoalMinutes: optionalWeeklyGoalSchema,
  secondUserId: z.string().min(1),
  secondUserName: z.string().trim().min(2).max(60),
  secondUserLogin: loginNameSchema,
  secondUserPassword: optionalPasswordSchema,
  secondUserWeeklyGoalMinutes: optionalWeeklyGoalSchema,
});

function userSettingsData(
  name: string,
  login: string,
  password?: string,
): Prisma.UserUpdateInput {
  return {
    name,
    login,
    ...(password
      ? { passwordHash: hashPassword(password) }
      : {}),
  };
}

export async function updateSettings(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(parsed.error);

  try {
    const workspace = await requireOwner();
    const validUserIds = new Set(
      workspace.memberships.map((membership) => membership.userId),
    );
    if (
      !validUserIds.has(parsed.data.firstUserId) ||
      !validUserIds.has(parsed.data.secondUserId) ||
      parsed.data.firstUserLogin === parsed.data.secondUserLogin
    ) {
      throw new Error("Usuários ou logins inválidos.");
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
          weeklyGoalMinutes: parsed.data.weeklyGoalMinutes,
        },
      }),
      prisma.user.update({
        where: { id: parsed.data.firstUserId },
        data: userSettingsData(
          parsed.data.firstUserName,
          parsed.data.firstUserLogin,
          parsed.data.firstUserPassword,
        ),
      }),
      prisma.user.update({
        where: { id: parsed.data.secondUserId },
        data: userSettingsData(
          parsed.data.secondUserName,
          parsed.data.secondUserLogin,
          parsed.data.secondUserPassword,
        ),
      }),
      prisma.examMembership.update({
        where: {
          userId_examId: {
            userId: parsed.data.firstUserId,
            examId: workspace.id,
          },
        },
        data: {
          weeklyGoalMinutes: parsed.data.firstUserWeeklyGoalMinutes,
        },
      }),
      prisma.examMembership.update({
        where: {
          userId_examId: {
            userId: parsed.data.secondUserId,
            examId: workspace.id,
          },
        },
        data: {
          weeklyGoalMinutes: parsed.data.secondUserWeeklyGoalMinutes,
        },
      }),
    ]);
    revalidatePath("/", "layout");
  } catch {
    return {
      status: "error",
      message: "Não foi possível salvar. Confira se os logins são únicos.",
    };
  }

  redirect("/");
}

async function availableLogin(preferred: string, userId: string) {
  let candidate = preferred;
  let suffix = 2;
  while (true) {
    const existing = await prisma.user.findUnique({ where: { login: candidate } });
    if (!existing || existing.id === userId) return candidate;
    candidate = `${preferred}${suffix}`;
    suffix += 1;
  }
}

async function ensureLegacyCredentials() {
  const exam = await prisma.exam.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      memberships: {
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        include: { user: true },
      },
    },
  });
  if (!exam) return;

  const baseLogin = (process.env.APP_LOGIN || "dev").trim().toLowerCase();
  const initialPassword = process.env.APP_PASSWORD || "dev";

  for (const [index, membership] of exam.memberships.entries()) {
    if (membership.user.login && membership.user.passwordHash) continue;
    const preferredLogin =
      index === 0
        ? baseLogin
        : baseLogin === "dev"
          ? `dev${index + 1}`
          : `${baseLogin}-${index + 1}`;
    const loginName = membership.user.login ||
      (await availableLogin(preferredLogin, membership.userId));
    await prisma.user.update({
      where: { id: membership.userId },
      data: {
        login: loginName,
        passwordHash:
          membership.user.passwordHash || hashPassword(initialPassword),
      },
    });
  }
}

export async function login(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      login: z.string().trim().toLowerCase().min(1, "Informe o login."),
      password: z.string().min(1, "Informe a senha."),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(parsed.error);

  await ensureLegacyCredentials();
  const user = await prisma.user.findUnique({
    where: { login: parsed.data.login },
  });
  if (
    !user?.passwordHash ||
    !verifyPassword(parsed.data.password, user.passwordHash)
  ) {
    return { status: "error", message: "Login ou senha incorretos." };
  }

  const membership = await prisma.examMembership.findFirst({
    where: { userId: user.id },
  });
  if (!membership) {
    return { status: "error", message: "Usuário sem espaço de estudos." };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,
    await createSessionToken(user.id),
    sessionCookieOptions,
  );
  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/entrar");
}
