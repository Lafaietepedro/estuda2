export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export const initialFormState: FormState = { status: "idle" };
