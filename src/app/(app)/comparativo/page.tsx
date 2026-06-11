import { Scale } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = {
  title: "Comparativo",
};

export default function ComparisonPage() {
  return (
    <PagePlaceholder
      eyebrow="Dupla"
      title="Comparativo"
      description="Compare o ritmo e os resultados da dupla de forma saudável e transparente."
      icon={Scale}
    />
  );
}

