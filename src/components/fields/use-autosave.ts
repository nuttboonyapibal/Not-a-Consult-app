"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Data } from "@/frameworks/types";
import type { ActionResult } from "@/lib/actions/result";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

/**
 * Keeps form data locally and saves only the changed keys after a short pause.
 * Saves run one after another so a slow request can't overwrite a newer one.
 */
export function useAutosave(initial: Data, save: (patch: Data) => Promise<ActionResult>, delay = 700) {
  const [data, setData] = useState<Data>(initial);
  const [state, setState] = useState<SaveState>("idle");
  const dirty = useRef<Data>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    queue.current = queue.current.then(async () => {
      const patch = dirty.current;
      dirty.current = {};
      if (Object.keys(patch).length === 0) return;
      setState("saving");
      const res = await saveRef.current(patch).catch(
        (e: unknown): ActionResult => ({ ok: false, error: e instanceof Error ? e.message : "error" }),
      );
      if (res.ok) {
        setState(Object.keys(dirty.current).length ? "dirty" : "saved");
      } else {
        dirty.current = { ...patch, ...dirty.current };
        setState("error");
      }
    });
    return queue.current;
  }, []);

  const setFields = useCallback(
    (patch: Data) => {
      setData((d) => ({ ...d, ...patch }));
      dirty.current = { ...dirty.current, ...patch };
      setState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush, delay],
  );

  const setField = useCallback((key: string, value: unknown) => setFields({ [key]: value }), [setFields]);

  useEffect(() => {
    const onLeave = () => {
      if (Object.keys(dirty.current).length) void flush();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      onLeave();
    };
  }, [flush]);

  return { data, setField, setFields, state, flush };
}
