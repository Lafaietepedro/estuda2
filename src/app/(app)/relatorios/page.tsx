import { BarChart3 } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = {
  title: "Relatórios",
};

export default function ReportsPage() {
  return (
    <PagePlaceholder
      eyebrow="Análise"
      title="Relatórios"
      description="Visualize tendências de estudo, desempenho e distribuição de esforço ao longo do tempo."
      icon={BarChart3}
    />
  );
}

