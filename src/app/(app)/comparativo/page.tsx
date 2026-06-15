import { PageHeading } from "@/components/page-heading";
import { getWorkspace } from "@/lib/data";
import { minutesToLabel, startOfCurrentWeek } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Comparativo",
};

export const dynamic = "force-dynamic";

export default async function ComparisonPage() {
  const workspace = await getWorkspace();
  const weekStart = startOfCurrentWeek();
  const [sessionTotals, weeklySessionTotals, questionTotals] = await Promise.all([
    prisma.studySession.groupBy({
      by: ["userId"],
      where: { examId: workspace.id },
      _sum: { durationMinutes: true },
      _count: true,
    }),
    prisma.studySession.groupBy({
      by: ["userId"],
      where: { examId: workspace.id, studiedAt: { gte: weekStart } },
      _sum: { durationMinutes: true },
    }),
    prisma.questionLog.groupBy({
      by: ["userId"],
      where: { examId: workspace.id },
      _sum: { questionsAnswered: true, correctAnswers: true },
    }),
  ]);
  const sessionsByUser = new Map(
    sessionTotals.map((item) => [item.userId, item]),
  );
  const questionsByUser = new Map(
    questionTotals.map((item) => [item.userId, item]),
  );
  const weeklySessionsByUser = new Map(
    weeklySessionTotals.map((item) => [
      item.userId,
      item._sum.durationMinutes ?? 0,
    ]),
  );
  const members = workspace.memberships.map((membership) => {
    const sessions = sessionsByUser.get(membership.userId);
    const questions = questionsByUser.get(membership.userId);
    const answered = questions?._sum.questionsAnswered ?? 0;
    const correct = questions?._sum.correctAnswers ?? 0;
    return {
      id: membership.userId,
      name: membership.user.name,
      minutes: sessions?._sum.durationMinutes ?? 0,
      sessions: sessions?._count ?? 0,
      weeklyMinutes: weeklySessionsByUser.get(membership.userId) ?? 0,
      weeklyGoalMinutes: membership.weeklyGoalMinutes,
      answered,
      accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    };
  });
  const maxMinutes = Math.max(...members.map((member) => member.minutes), 60);
  const maxQuestions = Math.max(...members.map((member) => member.answered), 10);

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Dupla"
        title="Comparativo"
        description="Uma visão transparente do ritmo de cada pessoa, sem transformar parceria em competição."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {members.map((member, index) => (
          <article
            key={member.id}
            className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex size-11 items-center justify-center rounded-full text-sm font-bold ${
                  index === 0
                    ? "bg-violet-100 text-violet-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {member.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <h2 className="text-lg font-semibold">{member.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {member.sessions} sessões registradas
                </p>
              </div>
            </div>

            <dl className="mt-7 grid grid-cols-3 gap-3">
              <div>
                <dt className="text-xs text-muted-foreground">Tempo</dt>
                <dd className="mt-1 font-semibold">
                  {minutesToLabel(member.minutes)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Questões</dt>
                <dd className="mt-1 font-semibold">{member.answered}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Acertos</dt>
                <dd className="mt-1 font-semibold">{member.accuracy}%</dd>
              </div>
            </dl>

            <div className="mt-7 space-y-4">
              {member.weeklyGoalMinutes && (
                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span>Meta desta semana</span>
                    <span>
                      {minutesToLabel(member.weeklyMinutes)} /{" "}
                      {minutesToLabel(member.weeklyGoalMinutes)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (member.weeklyMinutes / member.weeklyGoalMinutes) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <div>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span>Tempo estudado</span>
                  <span>{Math.round((member.minutes / maxMinutes) * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${(member.minutes / maxMinutes) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span>Questões resolvidas</span>
                  <span>{member.answered}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${(member.answered / maxQuestions) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
