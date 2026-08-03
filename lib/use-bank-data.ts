"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBankApi, type BankApi } from "@/lib/bank";

type LoadState<T> = { data: T | null; error: string | null };

export function useBankData<T>(
  loader: (api: BankApi) => Promise<T>,
  deps: unknown[] = [],
): { data: T | null; error: string | null; reload: () => void } {
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  const [state, setState] = useState<LoadState<T>>({ data: null, error: null });
  const [iter, setIter] = useState(0);

  useEffect(() => {
    let active = true;
    getBankApi()
      .then((api) => loaderRef.current(api))
      .then(
        (result) => {
          if (active) setState({ data: result, error: null });
        },
        (e) => {
          if (active) {
            setState({
              data: null,
              error: e instanceof Error ? e.message : "Failed to load data.",
            });
          }
        },
      );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iter, ...deps]);

  const reload = useCallback(() => setIter((i) => i + 1), []);
  return { data: state.data, error: state.error, reload };
}