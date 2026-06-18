"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RsvpFormData, rsvpFormSchema, attendingOptions } from "./schema";
import { useRsvp } from "./useRsvp";
import { Input } from "../ui/input";
import Image from "next/image";

export default function RsvpForm({ onSuccess }: { onSuccess?: () => void }) {
  const { loading, error, onSubmit } = useRsvp(onSuccess);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RsvpFormData>({
    resolver: zodResolver(rsvpFormSchema),
    defaultValues: { attending: "" },
  });

  const selectedAttending = useWatch({ control, name: "attending" });

  return (
    <div className="w-full max-w-[90vw] sm:max-w-2xl mx-auto bg-secondary px-6 py-10 overflow-auto max-h-[90vh]">
      <div className="relative mb-7">
        <Image
          src="/images/love.png"
          width={512}
          height={462}
          className="object-contain absolute inset-0 -top-2 mx-auto w-[70px]"
          alt=""
        />
        <Image
          src="/images/rsvp-text.png"
          width={683}
          height={202}
          className="object-contain w-[150px] mx-auto relative z-10"
          alt=""
        />
      </div>

      <h2 className="font-new-kansas text-center text-xl sm:text-2xl md:text-4xl mb-4 max-w-[250px] md:max-w-[500px] mx-auto">
        Are you gonna be there when we say {`"I do"`}?
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <Input
          label="Full name"
          {...register("fullName")}
          placeholder="Full name"
          error={errors.fullName}
          // note="First and last, please"
        />

        {/* Phone */}
        <Input
          label="Phone number"
          {...register("phone")}
          type="tel"
          placeholder="+234 000 0000 000"
          error={errors.phone}
          // note="we'll only reach out if something important comes up"
        />

        {/* Email */}
        <Input
          label="Email address (optional)"
          {...register("email")}
          type="email"
          placeholder="your@email.com"
          error={errors.email}
        />

        {/* Closest to */}
        <div className="">
          <label className="block text-black text-base mb-0.5">
            Will you be attending?
          </label>
          <div className="space-y-2 mt-2">
            {attendingOptions.map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="radio"
                  value={option}
                  {...register("attending")}
                  className="sr-only"
                />
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedAttending === option
                      ? "border-brand-pink"
                      : "border-gray-300"
                  }`}
                >
                  {selectedAttending === option && (
                    <span className="w-2 h-2 rounded-full bg-brand-pink" />
                  )}
                </span>
                <span
                  className={`text-base capitalize transition-colors ${
                    selectedAttending === option ? "text-brand-pink" : ""
                  }`}
                >
                  {option}
                </span>
              </label>
            ))}
          </div>
          {errors.attending && (
            <p className="text-red-500 text-xs mt-2">
              {errors.attending.message}
            </p>
          )}
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="w-fit mx-auto">
          <button
            className="text-base md:text-lg font-medium uppercase border-3 border-brand-pink rounded-full px-5 py-2 mt-7"
            type="submit"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit R.S.V.P 💌"}
          </button>
        </div>
      </form>
    </div>
  );
}
