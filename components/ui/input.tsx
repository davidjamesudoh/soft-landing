import * as React from "react";
import type { FieldError } from "react-hook-form";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  label?: string;
  error?: FieldError;
  note?: string;
};

function Input({ className, type, label, error, note, ...props }: InputProps) {
  return (
    <div className="">
      {label && (
        <label className="block text-black text-base mb-1.5 font-new-kansas">
          {label}
        </label>
      )}
      <input
        type={type}
        data-slot="input"
        aria-invalid={!!error}
        className={cn(
          "w-full px-4 py-2 h-[49px] border border-brand-pink rounded-full bg-white pb-1 outline-none text-sm placeholder:text-gray-300",
          "focus:outline-none focus:border-brand-pink focus:border-2",
          className,
        )}
        {...props}
      />
      {note && <em className="text-xs -mt-2">{note}</em>}
      {error?.message && (
        <p className="text-red text-xs text-left font-medium">
          {error.message}
        </p>
      )}
    </div>
  );
}

export { Input };
