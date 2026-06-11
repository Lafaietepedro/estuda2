import { CircleHelp } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = {
  title: "Questões",
};

export default function QuestionsPage() {
  return (
    <PagePlaceholder
      eyebrow="Desempenho"
      title="Questões"
      description="Registre questões resolvidas e acertos para acompanhar a evolução por matéria."
      icon={CircleHelp}
    />
  );
}

