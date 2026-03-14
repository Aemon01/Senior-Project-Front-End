import { apiFetch } from "@/lib/api/client";
import { Company } from "../types";

export async function fetchCompanies(signal?: AbortSignal): Promise<Company[]> {
  return apiFetch<Company[]>("/companies", { signal });
}
