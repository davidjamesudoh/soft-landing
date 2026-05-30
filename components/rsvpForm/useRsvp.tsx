"use client";
import { useState } from "react";
import { RsvpFormData } from "./schema";

export function useRsvp(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (formData: RsvpFormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (result?.duplicate) {
        setError("Looks like you've already RSVP'd with this email or phone number.");
        return;
      }

      if (!result?.success) {
        setError("Something went wrong. Please try again.");
        return;
      }

      onSuccess?.();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, onSubmit };
}
