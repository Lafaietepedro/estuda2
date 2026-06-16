"use client";

import { useActionState, useEffect, useRef } from "react";

import { createTopic, updateTopic } from "@/app/actions";
import {
  FieldError,
  fieldClassName,
  FormMessage,
  SubmitButton,
  textareaClassName,
} from "@/components/form-controls";
import { initialFormState } from "@/lib/form-state";
import { topicOptionLabel, type TopicOption } from "@/lib/topics";

type SubjectOption = {
  id: string;
  name: string;
};

type TopicFieldsProps = {
  subjects: SubjectOption[];
  parentTopics: TopicOption[];
  state: typeof initialFormState;
};

function TopicFields({ subjects, parentTopics, state }: TopicFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Matéria
          <select
            name="subjectId"
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
          Subtópico de
          <select name="parentId" className={`${fieldClassName} mt-1.5`}>
            <option value="">Tópico principal</option>
            {parentTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topicOptionLabel(topic)}
              </option>
            ))}
          </select>
          <FieldError errors={state.errors} name="parentId" />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Nome do tópico
        <input
          name="name"
          placeholder="Ex.: Controle de constitucionalidade"
          className={`${fieldClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="name" />
      </label>

      <label className="block text-sm font-medium">
        Observações{" "}
        <span className="font-normal text-muted-foreground">(opcional)</span>
        <textarea
          name="description"
          maxLength={500}
          placeholder="Banca, artigo, prioridade ou recorte do edital"
          className={`${textareaClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="description" />
      </label>
    </>
  );
}

export function TopicForm({
  subjects,
  parentTopics,
}: {
  subjects: SubjectOption[];
  parentTopics: TopicOption[];
}) {
  const [state, formAction] = useActionState(createTopic, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <TopicFields
        subjects={subjects}
        parentTopics={parentTopics}
        state={state}
      />
      <FormMessage state={state} />
      {subjects.length === 0 && (
        <p className="text-sm text-amber-700">
          Reative ou cadastre uma matéria antes de montar o edital.
        </p>
      )}
      <SubmitButton
        disabled={subjects.length === 0}
        pendingLabel="Adicionando..."
      >
        Adicionar tópico
      </SubmitButton>
    </form>
  );
}

export function TopicEditForm({
  topic,
}: {
  topic: {
    id: string;
    name: string;
    description: string;
  };
}) {
  const [state, formAction] = useActionState(updateTopic, initialFormState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={topic.id} />
      <label className="block text-sm font-medium">
        Nome
        <input
          name="name"
          defaultValue={topic.name}
          className={`${fieldClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="name" />
      </label>
      <label className="block text-sm font-medium">
        Observações
        <textarea
          name="description"
          maxLength={500}
          defaultValue={topic.description}
          className={`${textareaClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="description" />
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Salvando...">Salvar tópico</SubmitButton>
    </form>
  );
}
