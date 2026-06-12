import { PageHeading } from "@/components/page-heading";
import { SettingsForm } from "@/components/settings-form";
import { getWorkspace } from "@/lib/data";
import { formatDateInput } from "@/lib/dates";

export const metadata = {
  title: "Configurações",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const workspace = await getWorkspace();
  const users = workspace.memberships.map((membership) => ({
    id: membership.user.id,
    name: membership.user.name,
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

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <SettingsForm
          exam={{
            name: workspace.name,
            description: workspace.description ?? "",
            examDate: workspace.examDate
              ? formatDateInput(workspace.examDate)
              : "",
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
