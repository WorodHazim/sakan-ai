import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function hasHumanitarianCircumstance(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase();
  return (
    normalized !== "" &&
    normalized !== "none" &&
    normalized !== "no" &&
    normalized !== "n/a" &&
    normalized !== "null" &&
    normalized !== "undefined"
  );
}
