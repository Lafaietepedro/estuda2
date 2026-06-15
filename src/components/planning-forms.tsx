"use client";

import { useActionState, useEffect, useRef } from "react";

import { createPlanItem, updatePlanItem } from "@/app/actions";
import {
  FieldError,
  fieldClassName,
  FormMessage,
  SubmitButton,
  textareaClassName,
} from "@/components/form-controls";
import { initialFormState } from "@/lib/form-state";

type SubjectOption = {
  id: string;
  name: string;
};

type PlanItemFieldsProps = {
  subjects: SubjectOption[];
  defaults?: {
    kind: "STUDY" | "REVIEW";
    subjectId: string;
    scheduledFor: string;
    title: string;
    estimatedMinutes: number;
    notes: string;
  };
  state: typeof initialFormState;
};

function PlanItemFields({
  subjects,
  defaults,
  state,
}: PlanItemFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Tipo
          <select
            name="kind"
            defaultValue={defaults?.kind ?? "STUDY"}
            className={`${fieldClassName} mt-1.5`}
          >
            <option value="STUDY">Estudo</option>
            <option value="REVIEW">Revisão</option>
          </select>
          <FieldError errors={state.errors} name="kind" />
        </label>
        <label className="text-sm font-medium">
          Matéria
          <select
            name="subjectId"
            defaultValue={defaults?.subjectId}
            disabled={subjects.length === 0}
            className={`${fieldClassName} mt-1.5`}
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <FieldError errors={state.errors} name="subjectId" />
        </label>
        <label className="text-sm font-medium">
          Data
          <input
            name="scheduledFor"
            type="date"
            defaultValue={defaults?.scheduledFor}
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="scheduledFor" />
        </label>
        <label className="text-sm font-medium">
          Duração prevista
          <input
            name="estimatedMinutes"
            type="number"
            inputMode="numeric"
            min={5}
            max={1440}
            defaultValue={defaults?.estimatedMinutes}
            placeholder="Ex.: 45"
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="estimatedMinutes" />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Objetivo
        <input
          name="title"
          maxLength={120}
          defaultValue={defaults?.title}
          placeholder="Ex.: Revisar controle de constitucionalidade"
          className={`${fieldClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="title" />
      </label>
      <label className="block text-sm font-medium">
        Anotações{" "}
        <span className="font-normal text-muted-foreground">(opcional)</span>
        <textarea
          name="notes"
          maxLength={500}
          defaultValue={defaults?.notes}
          placeholder="Material, páginas ou pontos de atenção"
          className={`${textareaClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="notes" />
      </label>
    </>
  );
}

export function PlanItemForm({
  subjects,
  defaultDate,
}: {
  subjects: SubjectOption[];
  defaultDate: string;
}) {
  const [state, formAction] = useActionState(createPlanItem, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <PlanItemFields
        subjects={subjects}
        defaults={{
          kind: "STUDY",
          subjectId: subjects[0]?.id ?? "",
          scheduledFor: defaultDate,
          title: "",
          estimatedMinutes: 45,
          notes: "",
        }}
        state={state}
      />
      <FormMessage state={state} />
      {subjects.length === 0 && (
        <p className="text-sm text-amber-700">
          Reative ou cadastre uma matéria antes de planejar.
        </p>
      )}
      <SubmitButton
        disabled={subjects.length === 0}
        pendingLabel="Programando..."
      >
        Adicionar ao planejamento
      </SubmitButton>
    </form>
  );
}

export function PlanItemEditForm({
  item,
  subjects,
}: {
  item: {
    id: string;
    kind: "STUDY" | "REVIEW";
    subjectId: string;
    scheduledFor: string;
    title: string;
    estimatedMinutes: number;
    notes: string;
  };
  subjects: SubjectOption[];
}) {
  const [state, formAction] = useActionState(updatePlanItem, initialFormState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={item.id} />
      <PlanItemFields subjects={subjects} defaults={item} state={state} />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Atualizando...">
        Salvar alterações
      </SubmitButton>
    </form>
  );
}
