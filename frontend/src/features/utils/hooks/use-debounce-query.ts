import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";

// TODO: This is a test, it was not tested
export const useDebounceQuery = <T>(
  options: UseQueryOptions<T>,
  timeout: number = 500
) => {
  const [loading, setLoading] = useState(false);
  const [debouncedKey, setKey] = useDebounceValue(options.queryKey, timeout);
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    setLoading(true);
    setKey(options.queryKey);
  }, [options.queryKey]);

  const query = useQuery({
    ...options,
    queryKey: debouncedKey,
  });

  useEffect(() => {
    if (query.isFetched) {
      setLoading(false);
      setData((query.data || []) as T[]);
    }
  }, [query.data]);

  return {
    suggestions: {
      ...query,
      data,
      isPending: loading || query.isPending,
    },
  };
};
