// Biological calibration: finds a normal-hearing listener's thresholds (in dBFS) at every
// frequency and ear with the automated procedure, using a temporary scale (level = dBFS + 110).
import { useLang } from "@/modules/hearing/i18n";
import { emptyPerEar, type PerEar } from "@/modules/hearing/audio/levels";
import { SelfThresholdTest } from "./SelfThresholdTest";

const OFFSET = 110;
const SEQUENCE = [1000, 2000, 3000, 4000, 6000, 8000, 1500, 750, 500, 250, 125];

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
  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-4 text-sky-950 dark:bg-sky-950/30 dark:text-sky-100">
      <SelfThresholdTest
        sequence={SEQUENCE}
        toDbfs={(level) => level - OFFSET}
        maxLevel={() => Math.min(100, Math.floor((maxDbfs + OFFSET) / 5) * 5)}
        maxDbfs={maxDbfs}
        instructions={t("bio.listener_instructions")}
        buttonLabel={t("bio.hear_button")}
        cancelLabel={t("bio.cancel")}
        progress={(d, n) => t("bio.progress", d, n)}
        showStep={(s) => `${t(s.ear === "right" ? "hearing.ear.right" : "hearing.ear.left")} · ${s.frequency} Hz`}
        onCancel={onCancel}
        onDone={(results) => {
          const out = emptyPerEar();
          for (const ear of ["right", "left"] as const) {
            for (const [f, th] of Object.entries(results.thresholds[ear])) {
              if (th && "level" in th) out[ear][Number(f)] = th.level - OFFSET;
            }
          }
          onDone(out);
        }}
      />
    </div>
  );
}
