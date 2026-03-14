import { useEffect, useState } from "react";
import { fetchCompanies } from "../api/companies";
import { DEFAULT_COMPANIES } from "../data/companies";
import { Company } from "../types";

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>(DEFAULT_COMPANIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetchCompanies(controller.signal)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCompanies(data);
        }
      })
      .catch((err) => {
        const normalized = err instanceof Error ? err : new Error("Failed to fetch companies");
        setError(normalized);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { companies, loading, error };
}
