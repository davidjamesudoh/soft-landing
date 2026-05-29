"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { RsvpFormData } from "./schema";

export function useContact() {
  const [loading, setLoading] = useState(false);

  const onSubmitToNotion = async (formData: RsvpFormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!result?.success) {
        toast.error("Failed to submit RSVP.");
        return;
      }

      toast.success("RSVP received! We'll see you there 🤍");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return { loading, onSubmitToNotion };
}
