// Biological calibration: finds a normal-hearing listener's thresholds (in dBFS) at every
// frequency and ear with the automated procedure, using a temporary scale (level = dBFS + 110).
import { useEffect, useRef, useState } from "react";
import { Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/modules/hearing/i18n";
import { HughsonWestlake, type AutoStep } from "@/modules/hearing/audio/hughsonWestlake";
import { ToneEngine } from "@/modules/hearing/audio/toneEngine";
import { emptyPerEar, type PerEar } from "@/modules/hearing/audio/levels";

const OFFSET = 110;
const SEQUENCE = [1000, 2000, 3000, 4000, 6000, 8000, 1500, 750, 500, 250, 125];
const WINDOW_MS = 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function BiologicalListenerTest({
  maxDbfs,
  onDone,
  onCancel,
}: {
  maxDbfs: number;
  onDone: (thresholds: PerEar) => void;
  onCancel: () => void;
}) {
  const { t } = useLang();
  const [step, setStep] = useState<AutoStep | null>(null);
  const [done, setDone] = useState(0);
  const [pressed, setPressed] = useState(false);
  const engine = useRef(new ToneEngine());
  const stop = useRef(false);
  const windowOpen = useRef(false);
  const responded = useRef(false);
  const total = SEQUENCE.length * 2;

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
      ears: ["right", "left"],
      frequencies: SEQUENCE,
      sequence: SEQUENCE,
      maxLevel: () => Math.min(100, Math.floor((maxDbfs + OFFSET) / 5) * 5),
      catchRate: 0.1,
    });
    void (async () => {
      while (!runner.done && !stop.current) {
        const s = runner.next()!;
        setStep(s);
        responded.current = false;
        windowOpen.current = true;
        if (s.catchTrial) await sleep(1350);
        else await engine.current.present({ frequency: s.frequency, ear: s.ear, dbfs: s.level - OFFSET, maxDbfs, mode: "pulsed" });
        await sleep(WINDOW_MS);
        windowOpen.current = false;
        if (stop.current) break;
        runner.record(responded.current);
        const r = runner.results.thresholds;
        setDone(Object.keys(r.right).length + Object.keys(r.left).length);
        await sleep(800 + Math.random() * 1000);
      }
      engine.current.stop();
      if (stop.current) return;
      const out = emptyPerEar();
      for (const ear of ["right", "left"] as const) {
        for (const [f, th] of Object.entries(runner.results.thresholds[ear])) {
          if (th && "level" in th) out[ear][Number(f)] = th.level - OFFSET;
        }
      }
      onDone(out);
    })();
    return () => {
      stop.current = true;
      engine.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4 rounded-lg border border-sky-200 bg-sky-50/60 p-4">
      <p className="text-sm text-sky-950">{t("bio.listener_instructions")}</p>
      <div className="flex flex-wrap items-center gap-4">
        <Button
          size="lg"
          className="h-20 w-48 text-lg"
          onPointerDown={(e) => {
            e.preventDefault();
            respond();
          }}
        >
          {t("bio.hear_button")}
        </Button>
        <span className={`h-10 w-10 rounded-full border-4 ${pressed ? "border-emerald-600 bg-emerald-400" : "border-muted bg-background"}`} />
        <div className="text-sm">
          {step ? (
            <p className={step.ear === "right" ? "font-semibold text-red-600" : "font-semibold text-blue-600"}>
              {t(step.ear === "right" ? "hearing.ear.right" : "hearing.ear.left")} · {step.frequency} Hz
            </p>
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <p className="text-muted-foreground">{t("bio.progress", done, total)}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          stop.current = true;
          engine.current.stop();
          onCancel();
        }}
      >
        <Square className="mr-1 h-3.5 w-3.5" />
        {t("bio.cancel")}
      </Button>
    </div>
  );
}
