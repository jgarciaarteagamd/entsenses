// Self-administered threshold search: the listener presses a big button (or the space bar) every
// time they hear a beep, and the automated procedure (modified Hughson-Westlake, explicit
// frequency order) finds the faintest level heard at each frequency and ear. Used by the
// biological calibration and by the patient's informative remote check.
import { useEffect, useRef, useState } from "react";
import { Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HughsonWestlake, type AutoResults, type AutoStep } from "@/modules/hearing/audio/hughsonWestlake";
import { ToneEngine } from "@/modules/hearing/audio/toneEngine";
import type { EarSide } from "@/modules/hearing/audio/levels";

const WINDOW_MS = 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface SelfThresholdTestProps {
  sequence: number[];
  ears?: EarSide[];
  /** Level scale of the procedure → digital level. */
  toDbfs: (level: number, frequency: number) => number;
  maxLevel: (ear: EarSide, frequency: number) => number;
  maxDbfs: number;
  /** Pass an engine already unlocked by a tap (iOS needs the audio started from a gesture). */
  engine?: ToneEngine;
  instructions: string;
  buttonLabel: string;
  cancelLabel: string;
  /** Progress text from (done, total). */
  progress: (done: number, total: number) => string;
  /** Shows the ear and frequency being tested (technical users only). */
  showStep?: (step: AutoStep) => string;
  onDone: (results: AutoResults) => void;
  onCancel: () => void;
}

export function SelfThresholdTest(p: SelfThresholdTestProps) {
  const ears = p.ears ?? ["right", "left"];
  const [step, setStep] = useState<AutoStep | null>(null);
  const [done, setDone] = useState(0);
  const [pressed, setPressed] = useState(false);
  const engine = useRef(p.engine ?? new ToneEngine());
  const stop = useRef(false);
  const windowOpen = useRef(false);
  const responded = useRef(false);
  const total = p.sequence.length * ears.length;

  const respond = () => {
    if (windowOpen.current) responded.current = true;
    setPressed(true);
    setTimeout(() => setPressed(false), 150);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      e.preventDefault();
      respond();
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const runner = new HughsonWestlake({
      ears,
      frequencies: p.sequence,
      sequence: p.sequence,
      maxLevel: p.maxLevel,
      catchRate: 0.1,
    });
    const eng = engine.current;
    // Per-run flag: React may mount, clean up and mount again (StrictMode); only the latest run
    // keeps going. `stop` is the user's Cancel.
    let cancelled = false;
    const halted = () => cancelled || stop.current;
    void (async () => {
      while (!runner.done && !halted()) {
        const s = runner.next()!;
        setStep(s);
        responded.current = false;
        windowOpen.current = true;
        if (s.catchTrial) await sleep(1350);
        else await eng.present({ frequency: s.frequency, ear: s.ear, dbfs: p.toDbfs(s.level, s.frequency), maxDbfs: p.maxDbfs, mode: "pulsed" });
        if (cancelled) return;
        await sleep(WINDOW_MS);
        if (cancelled) return;
        windowOpen.current = false;
        if (stop.current) break;
        runner.record(responded.current);
        const r = runner.results.thresholds;
        setDone(Object.keys(r.right).length + Object.keys(r.left).length);
        await sleep(800 + Math.random() * 1000);
      }
      if (cancelled) return;
      eng.stop();
      if (!stop.current) p.onDone(runner.results);
    })();
    return () => {
      cancelled = true;
      eng.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = Math.round((done / total) * 100);

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6">{p.instructions}</p>
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          className={`flex h-44 w-44 select-none items-center justify-center rounded-full border-8 text-center text-xl font-bold shadow-lg transition-transform active:scale-95 ${
            pressed ? "border-emerald-500 bg-emerald-600 text-white" : "border-primary/30 bg-primary text-primary-foreground"
          }`}
          style={{ touchAction: "manipulation" }}
          onPointerDown={(e) => {
            e.preventDefault();
            respond();
          }}
        >
          {p.buttonLabel}
        </button>
        {step && p.showStep && (
          <p className={step.ear === "right" ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-blue-600"}>{p.showStep(step)}</p>
        )}
        <div className="w-full max-w-xs">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground">{p.progress(done, total)}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          stop.current = true;
          engine.current.stop();
          p.onCancel();
        }}
      >
        <Square className="mr-1 h-3.5 w-3.5" />
        {p.cancelLabel}
      </Button>
    </div>
  );
}
