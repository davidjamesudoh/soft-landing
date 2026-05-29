import * as z from "zod";

export const attendingOptions = [
  "Yes! Wouldn’t miss it for anything",
  "No :( Sadly can’t make it",
] as const;

export const rsvpFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  email: z.email("Please enter a valid email"),
  attending: z.string().min(1, "Please select an option"),
});

export type RsvpFormData = z.infer<typeof rsvpFormSchema>;
