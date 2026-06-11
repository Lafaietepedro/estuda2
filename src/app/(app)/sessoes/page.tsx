import { TimerReset } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = {
  title: "Sessões",
};

export default function SessionsPage() {
  return (
    <PagePlaceholder
      eyebrow="Rotina"
      title="Sessões de estudo"
      description="Registre o tempo dedicado, a matéria estudada e as anotações de cada sessão."
      icon={TimerReset}
    />
  );
}

