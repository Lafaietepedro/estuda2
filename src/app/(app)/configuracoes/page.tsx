import { Sparkles } from "lucide-react";

import { PageHeading } from "@/components/page-heading";
import { SettingsForm } from "@/components/settings-form";
import { getWorkspace } from "@/lib/data";
import { formatDateInput } from "@/lib/dates";

export const metadata = {
  title: "Configurações",
};

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams: Promise<{ "primeiro-acesso"?: string }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const query = await searchParams;
  const workspace = await getWorkspace();
  const users = workspace.memberships.map((membership) => ({
    id: membership.user.id,
    name: membership.user.name,
    login: membership.user.login ?? "",
    weeklyGoalMinutes: membership.weeklyGoalMinutes,
  }));

  if (users.length < 2) {
    throw new Error("O espaço precisa ter dois integrantes.");
  }

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Personalização"
        title="Configurações"
        description="Ajuste os nomes da dupla e o objetivo que vocês estão perseguindo."
      />

      {query["primeiro-acesso"] === "1" && (
        <div className="flex gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-violet-950">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-violet-600" />
          <div>
            <p className="font-semibold">Vamos preparar o espaço de vocês</p>
            <p className="mt-1 text-sm leading-6 text-violet-800">
              Informe os nomes da dupla e o concurso. Depois disso, vocês já
              podem começar a registrar estudos.
            </p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <SettingsForm
          exam={{
            name: workspace.name,
            description: workspace.description ?? "",
            examDate: workspace.examDate
              ? formatDateInput(workspace.examDate)
              : "",
            weeklyGoalMinutes: workspace.weeklyGoalMinutes,
            reviewIntervals: workspace.reviewIntervals,
            reviewMinutes: workspace.reviewMinutes,
          }}
          users={[
            users[0],
            users[1],
          ]}
        />
      </section>
    </div>
  );
}
