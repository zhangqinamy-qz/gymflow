import { useState, useRef } from "react";

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  // Keep a ref so that any captured setter always reads the latest value,
  // even if called from a stale async closure after re-renders.
  const valueRef = useRef(value);
  valueRef.current = value;

  const set = (next) => {
    const val = typeof next === "function" ? next(valueRef.current) : next;
    setValue(val);
    localStorage.setItem(key, JSON.stringify(val));
  };

  return [value, set];
}
