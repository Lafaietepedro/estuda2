import { BookOpen } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = {
  title: "Matérias",
};

export default function SubjectsPage() {
  return (
    <PagePlaceholder
      eyebrow="Organização"
      title="Matérias"
      description="Organize as disciplinas do concurso e acompanhe o foco da dupla em cada uma."
      icon={BookOpen}
    />
  );
}

