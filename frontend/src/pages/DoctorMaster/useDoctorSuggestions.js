import { useEffect, useState } from "react";
import { suggestDoctors } from "./DoctorMasterService";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 350;

export default function useDoctorSuggestions(query, excludeId = null) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = (query || "").trim();
    if (q.length < MIN_CHARS) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      suggestDoctors(q)
        .then((res) => {
          if (cancelled) return;
          const list = (res.data.data || []).filter((d) => d.id !== excludeId);
          setSuggestions(list);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, excludeId]);

  return { suggestions, loading };
}
