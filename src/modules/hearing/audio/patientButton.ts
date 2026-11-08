// Patient response button: any USB/Bluetooth button that acts as a keyboard key (Space, Enter, a
// letter…). The chosen key is remembered on this browser.
import { useEffect, useRef, useState } from "react";

const KEY = "entsenses.hearing.patientKey";

export function loadPatientKey(): string {
  try {
    return window.localStorage.getItem(KEY) || "Space";
  } catch {
    return "Space";
  }
}

export function savePatientKey(code: string) {
  try {
    window.localStorage.setItem(KEY, code);
  } catch {
    // ignore
  }
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);

/** Tracks the patient button: whether it is held and the time of the last press. */
export function usePatientButton(code: string, onPress?: () => void) {
  const [pressed, setPressed] = useState(false);
  const cb = useRef(onPress);
  cb.current = onPress;
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== code || isTyping(e.target)) return;
      e.preventDefault();
      if (!e.repeat) {
        setPressed(true);
        cb.current?.();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== code) return;
      e.preventDefault();
      setPressed(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [code]);
  return pressed;
}
