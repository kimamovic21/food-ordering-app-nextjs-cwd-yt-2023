import * as z from 'zod';

export const passwordRequirements = [
  {
    regex: /.{6,}/,
    text: 'At least 6 characters',
    message: 'Password must be at least 6 characters.',
  },
  {
    regex: /[a-z]/,
    text: 'At least 1 lowercase letter',
    message: 'Password must contain at least 1 lowercase letter.',
  },
  {
    regex: /[A-Z]/,
    text: 'At least 1 uppercase letter',
    message: 'Password must contain at least 1 uppercase letter.',
  },
  {
    regex: /[0-9]/,
    text: 'At least 1 number',
    message: 'Password must contain at least 1 number.',
  },
  {
    regex: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/,
    text: 'At least 1 special character',
    message: 'Password must contain at least 1 special character.',
  },
] as const;

export const strongPasswordSchema = z
  .string()
  .max(64, { message: 'Password must be 64 characters or fewer.' })
  .superRefine((value, ctx) => {
    for (const requirement of passwordRequirements) {
      if (!requirement.regex.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: requirement.message,
          path: [],
        });
        return;
      }
    }
  });