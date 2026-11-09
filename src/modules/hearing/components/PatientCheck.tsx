// Patient's informative hearing check (QR link, anonymous, NOT calibrated): questions, red flags,
// quiet place, headphones, volume setting, left/right check, automated tone test with the big
// "I hear it" button, plain-language result and anonymous submission to the doctor's inbox.
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, Headphones, Info, Loader2, Play, RotateCcw, Send, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/modules/hearing/i18n";
import { ToneEngine } from "@/modules/hearing/audio/toneEngine";
import type { AutoResults } from "@/modules/hearing/audio/hughsonWestlake";
import type { EarSide } from "@/modules/hearing/audio/levels";
import { submitPatientSession } from "@/modules/hearing/lib/sessions";
import type { AgeGroup, Sex } from "@/modules/hearing/lib/session";
import {
  RED_FLAGS,
  REF_DBFS,
  REF_FREQUENCY,
  REMOTE_MAX_DBFS,
  REMOTE_SEQUENCE,
  assess,
  estToDbfs,
  questionnaireScore,
  remoteAudiogramJson,
  remoteMaxLevel,
  thresholdsFromRun,
  type EarCategory,
  type RedFlag,
  type RemoteAnswers,
  type RemoteAssessment,
} from "@/modules/hearing/lib/remoteCheck";
import { SelfThresholdTest } from "./SelfThresholdTest";

type Step = "intro" | "about" | "q" | "flags" | "quiet" | "hp" | "volume" | "channels" | "instructions" | "test" | "result" | "done";

type Question = { key: keyof RemoteAnswers; options: { value: RemoteAnswers[keyof RemoteAnswers]; label: string }[] };

const scale = (prefix: string) => [0, 1, 2, 3, 4].map((v) => ({ value: v as 0, label: `${prefix}.${v}` }));
const QUESTIONS: Question[] = [
  { key: "selfRating", options: scale("pc.opt.rating") },
  { key: "quiet", options: scale("pc.opt.freq") },
  { key: "noise", options: scale("pc.opt.freq") },
  { key: "phone", options: scale("pc.opt.freq") },
  { key: "tv", options: scale("pc.opt.freq") },
  { key: "worseEar", options: (["none", "right", "left"] as const).map((v) => ({ value: v, label: `pc.opt.worseEar.${v}` })) },
  { key: "tinnitus", options: (["no", "sometimes", "constant"] as const).map((v) => ({ value: v, label: `pc.opt.tinnitus.${v}` })) },
];

const SEXES: Sex[] = ["female", "male", "unspecified"];
const AGES: AgeGroup[] = ["18-39", "40-59", "60+", "<18", "unspecified"];
const CHANNEL_LEVEL = 40;

function shuffleEars(): EarSide[] {
  return Math.random() < 0.5 ? ["right", "left"] : ["left", "right"];
}

function Choice({ selected, onClick, children }: { selected?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border-2 px-4 py-4 text-center text-base font-medium transition-colors ${
        selected ? "border-primary bg-primary text-primary-foreground" : "border-primary/40 bg-primary/5 hover:bg-primary/10"
      }`}
    >
      {children}
    </button>
  );
}

function Gauge({ category }: { category: EarCategory }) {
  const { t } = useLang();
  const pos = { good: 16, possible_loss: 50, probable_loss: 84, incomplete: -1 }[category];
  return (
    <div className="space-y-1">
      <div className="relative h-4">
        {pos >= 0 && (
          <span className="absolute -top-1 h-0 w-0 -translate-x-1/2 border-x-8 border-t-[12px] border-x-transparent border-t-foreground" style={{ left: `${pos}%` }} />
        )}
      </div>
      <div className="flex h-4 overflow-hidden rounded-full">
        <div className="flex-1 bg-emerald-500" />
        <div className="flex-1 bg-amber-400" />
        <div className="flex-1 bg-rose-500" />
      </div>
      <div className="flex text-[11px] text-muted-foreground">
        <span className="flex-1">{t("pc.gauge.good")}</span>
        <span className="flex-1 text-center">{t("pc.gauge.possible")}</span>
        <span className="flex-1 text-right">{t("pc.gauge.probable")}</span>
      </div>
    </div>
  );
}

export function PatientCheck({ doctorId }: { doctorId: string }) {
  const { t, lang } = useLang();
  const [step, setStep] = useState<Step>("intro");
  const [accepted, setAccepted] = useState(false);
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState<AgeGroup | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<RemoteAnswers>({});
  const [flags, setFlags] = useState<RedFlag[]>([]);
  const [flagsConfirmed, setFlagsConfirmed] = useState(false);
  const [transducer, setTransducer] = useState<"circumaural" | "earbuds" | null>(null);
  const [connection, setConnection] = useState<"wired" | "wireless" | null>(null);
  const [playing, setPlaying] = useState(false);
  const [heardRef, setHeardRef] = useState(false);
  const [chOrder, setChOrder] = useState<EarSide[]>(shuffleEars);
  const [chIndex, setChIndex] = useState(0);
  const [chPlayed, setChPlayed] = useState(false);
  const [chWrong, setChWrong] = useState(false);
  const [run, setRun] = useState<AutoResults | null>(null);
  const [assessment, setAssessment] = useState<RemoteAssessment | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const engine = useRef(new ToneEngine());

  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (step !== "volume") {
      engine.current.stop();
      setPlaying(false);
    }
  }, [step, qIndex]);

  useEffect(() => () => engine.current.stop(), []);

  const go = (s: Step) => setStep(s);

  async function toggleReference() {
    if (playing) {
      engine.current.stop();
      setPlaying(false);
      return;
    }
    await engine.current.startReference({ frequency: REF_FREQUENCY, ear: "both", dbfs: REF_DBFS, maxDbfs: REMOTE_MAX_DBFS });
    setPlaying(true);
    setHeardRef(true);
  }

  async function playChannel() {
    setChPlayed(false);
    await engine.current.present({
      frequency: REF_FREQUENCY,
      ear: chOrder[chIndex],
      dbfs: estToDbfs(CHANNEL_LEVEL, REF_FREQUENCY),
      maxDbfs: REMOTE_MAX_DBFS,
      mode: "pulsed",
    });
    setChPlayed(true);
  }

  function answerChannel(a: EarSide | "both") {
    if (a !== chOrder[chIndex]) {
      setChWrong(true);
      return;
    }
    if (chIndex + 1 >= chOrder.length) go("instructions");
    else {
      setChIndex(chIndex + 1);
      setChPlayed(false);
    }
  }

  function resetChannels() {
    setChOrder(shuffleEars());
    setChIndex(0);
    setChPlayed(false);
    setChWrong(false);
  }

  function finishTest(results: AutoResults) {
    const fpr = results.catchTrials ? results.falsePositives / results.catchTrials : 0;
    setRun(results);
    setAssessment(assess({ thresholds: thresholdsFromRun(results), answers, redFlags: flags, falsePositiveRate: fpr, warnings: results.warnings }));
    go("result");
  }

  async function send() {
    if (!run || !assessment) return;
    setSending(true);
    setError(null);
    try {
      await submitPatientSession(doctorId, {
        info: { sex: sex ?? "unspecified", ageGroup: age ?? "unspecified", lang },
        device: { entry: "remote", transducer: transducer ?? "unknown", connection: connection ?? "unknown" },
        questionnaire: { version: 1, answers: { ...answers }, redFlags: [...flags], score: questionnaireScore(answers) },
        audiogram: remoteAudiogramJson(thresholdsFromRun(run)),
        quality: {
          falsePositiveRate: run.catchTrials ? Math.round((run.falsePositives / run.catchTrials) * 100) / 100 : 0,
          warnings: ["procedure_remote", ...run.warnings],
          presentations: run.presentations,
          catchTrials: run.catchTrials,
          falsePositives: run.falsePositives,
          channelCheck: true,
          assessment: { ...assessment },
        },
      });
      go("done");
    } catch (e) {
      console.error("[hearing patient submit]", e);
      setError(t("pc.res.error"));
    } finally {
      setSending(false);
    }
  }

  function repeatTest() {
    setRun(null);
    setAssessment(null);
    setAttempt((a) => a + 1);
    resetChannels();
    go("volume");
  }

  const back = (s: Step) => (
    <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => go(s)}>
      <ChevronLeft className="mr-1 h-4 w-4" />
      {t("pc.back")}
    </Button>
  );

  const urgentBox = (
    <div className="flex gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm leading-6 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">{t("pc.urgent.title")}</p>
        <p>{t("pc.urgent.body")}</p>
      </div>
    </div>
  );

  let body: React.ReactNode = null;

  if (step === "intro") {
    body = (
      <div className="space-y-6 text-center">
        <Headphones className="mx-auto h-14 w-14 text-primary" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold leading-tight">{t("pc.intro.title")}</h1>
          <p className="text-muted-foreground">{t("pc.intro.need")}</p>
        </div>
        <ol className="mx-auto max-w-sm space-y-3 text-left">
          {(["pc.intro.step1", "pc.intro.step2", "pc.intro.step3"] as const).map((k, i) => (
            <li key={k} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{i + 1}</span>
              <span>{t(k)}</span>
            </li>
          ))}
        </ol>
        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-left text-sm leading-6 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <Info className="h-5 w-5 shrink-0" />
          <span>{t("patient.disclaimer")}</span>
        </div>
        <p className="text-left text-xs leading-5 text-muted-foreground">{t("pc.intro.privacy")}</p>
        <label className="flex items-start gap-3 text-left text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>{t("pc.intro.accept")}</span>
        </label>
        <Button size="lg" className="h-14 w-full rounded-2xl text-lg" disabled={!accepted} onClick={() => go("about")}>
          {t("pc.start")}
        </Button>
      </div>
    );
  } else if (step === "about") {
    body = (
      <div className="space-y-5">
        {back("intro")}
        <div className="space-y-1 text-center">
          <h2 className="text-2xl font-bold">{t("pc.about.title")}</h2>
          <p className="text-muted-foreground">{t("pc.about.body")}</p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold">{t("pc.about.sex")}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {SEXES.map((s) => (
              <Choice key={s} selected={sex === s} onClick={() => setSex(s)}>
                {t(`setup.sex.${s}`)}
              </Choice>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="font-semibold">{t("pc.about.age")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {AGES.map((a) => (
              <Choice key={a} selected={age === a} onClick={() => setAge(a)}>
                {t(`setup.age.${a}`)}
              </Choice>
            ))}
          </div>
          {age === "<18" && <p className="text-sm text-amber-700 dark:text-amber-300">{t("pc.about.minor")}</p>}
        </div>
        <Button size="lg" className="h-14 w-full rounded-2xl text-lg" disabled={!sex || !age} onClick={() => { setQIndex(0); go("q"); }}>
          {t("pc.next")}
        </Button>
      </div>
    );
  } else if (step === "q") {
    const q = QUESTIONS[qIndex];
    body = (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => (qIndex === 0 ? go("about") : setQIndex(qIndex - 1))}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("pc.back")}
        </Button>
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("pc.q.counter", qIndex + 1, QUESTIONS.length)}</p>
          <div className="mx-auto h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${((qIndex + 1) / QUESTIONS.length) * 100}%` }} />
          </div>
        </div>
        <h2 className="text-center text-2xl font-semibold leading-snug">{t(`pc.q.${q.key}`)}</h2>
        <div className="space-y-3">
          {q.options.map((o) => (
            <Choice
              key={String(o.value)}
              selected={answers[q.key] === o.value}
              onClick={() => {
                setAnswers((a) => ({ ...a, [q.key]: o.value }));
                if (qIndex + 1 < QUESTIONS.length) setQIndex(qIndex + 1);
                else {
                  setFlagsConfirmed(false);
                  go("flags");
                }
              }}
            >
              {t(o.label)}
            </Choice>
          ))}
        </div>
      </div>
    );
  } else if (step === "flags") {
    const toggle = (f: RedFlag) => setFlags((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
    body = (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => { setQIndex(QUESTIONS.length - 1); go("q"); }}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("pc.back")}
        </Button>
        <div className="space-y-1 text-center">
          <h2 className="text-2xl font-semibold">{t("pc.flags.title")}</h2>
          <p className="text-muted-foreground">{t("pc.flags.hint")}</p>
        </div>
        {flagsConfirmed && flags.length > 0 ? (
          <>
            {urgentBox}
            <Button size="lg" className="h-14 w-full rounded-2xl text-lg" onClick={() => go("quiet")}>
              {t("pc.continue")}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              {RED_FLAGS.map((f) => (
                <label key={f} className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 text-left ${flags.includes(f) ? "border-rose-400 bg-rose-50 dark:bg-rose-950/30" : "border-muted"}`}>
                  <input type="checkbox" className="mt-1 h-5 w-5" checked={flags.includes(f)} onChange={() => toggle(f)} />
                  <span>{t(`pc.flag.${f}`)}</span>
                </label>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Choice onClick={() => { setFlags([]); go("quiet"); }}>{t("pc.flags.none")}</Choice>
              <Button size="lg" className="h-auto rounded-2xl py-4 text-base" disabled={flags.length === 0} onClick={() => setFlagsConfirmed(true)}>
                {t("pc.continue")}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  } else if (step === "quiet") {
    body = (
      <div className="space-y-6 text-center">
        <div className="text-left">{back("flags")}</div>
        <h2 className="text-2xl font-bold">{t("pc.quiet.title")}</h2>
        <p className="text-lg leading-7 text-muted-foreground">{t("pc.quiet.body")}</p>
        <Button size="lg" className="h-14 w-full rounded-2xl text-lg" onClick={() => go("hp")}>
          {t("pc.quiet.ok")}
        </Button>
      </div>
    );
  } else if (step === "hp") {
    body = (
      <div className="space-y-5">
        {back("quiet")}
        <h2 className="text-center text-2xl font-bold">{t("pc.hp.title")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Choice selected={transducer === "circumaural"} onClick={() => setTransducer("circumaural")}>
            <Headphones className="mx-auto mb-2 h-8 w-8" />
            {t("pc.hp.over")}
          </Choice>
          <Choice selected={transducer === "earbuds"} onClick={() => setTransducer("earbuds")}>
            <Volume2 className="mx-auto mb-2 h-8 w-8" />
            {t("pc.hp.in")}
          </Choice>
        </div>
        <p className="text-center text-sm text-muted-foreground">{t("pc.hp.hint")}</p>
        <h2 className="pt-2 text-center text-xl font-bold">{t("pc.conn.title")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Choice selected={connection === "wired"} onClick={() => setConnection("wired")}>{t("pc.conn.wired")}</Choice>
          <Choice selected={connection === "wireless"} onClick={() => setConnection("wireless")}>{t("pc.conn.wireless")}</Choice>
        </div>
        <p className="text-center text-sm text-muted-foreground">{t("pc.conn.hint")}</p>
        <Button size="lg" className="h-14 w-full rounded-2xl text-lg" disabled={!transducer || !connection} onClick={() => { setHeardRef(false); go("volume"); }}>
          {t("pc.next")}
        </Button>
      </div>
    );
  } else if (step === "volume") {
    body = (
      <div className="space-y-5 text-center">
        <div className="text-left">{back("hp")}</div>
        <h2 className="text-2xl font-bold">{t("pc.vol.title")}</h2>
        <p className="leading-7">{t("pc.vol.body")}</p>
        <Button size="lg" variant={playing ? "secondary" : "default"} className="h-16 w-full rounded-2xl text-lg" onClick={toggleReference}>
          {playing ? <Square className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
          {playing ? t("pc.vol.stop") : t("pc.vol.play")}
        </Button>
        <p className="text-sm font-semibold">{t("pc.vol.keep")}</p>
        <p className="text-xs text-muted-foreground">{t("pc.vol.iphone")}</p>
        <Button
          size="lg"
          className="h-14 w-full rounded-2xl text-lg"
          disabled={!heardRef}
          onClick={() => {
            engine.current.stop();
            setPlaying(false);
            resetChannels();
            go("channels");
          }}
        >
          {t("pc.vol.done")}
        </Button>
      </div>
    );
  } else if (step === "channels") {
    body = (
      <div className="space-y-5 text-center">
        <div className="text-left">{back("volume")}</div>
        <h2 className="text-2xl font-bold">{t("pc.ch.title")}</h2>
        <p className="leading-7">{t("pc.ch.body")}</p>
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("pc.ch.counter", chIndex + 1, chOrder.length)}</p>
        {chWrong ? (
          <>
            <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-left text-sm leading-6 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{t("pc.ch.wrong")}</span>
            </div>
            <Button size="lg" className="h-14 w-full rounded-2xl text-lg" onClick={resetChannels}>
              <RotateCcw className="mr-2 h-5 w-5" />
              {t("pc.ch.again")}
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" variant={chPlayed ? "outline" : "default"} className="h-16 w-full rounded-2xl text-lg" onClick={playChannel}>
              <Play className="mr-2 h-5 w-5" />
              {t("pc.ch.play")}
            </Button>
            {chPlayed && (
              <div className="space-y-3">
                <p className="font-semibold">{t("pc.ch.question")}</p>
                <div className="grid grid-cols-3 gap-2">
                  <Choice onClick={() => answerChannel("left")}>{t("pc.ch.left")}</Choice>
                  <Choice onClick={() => answerChannel("both")}>{t("pc.ch.both")}</Choice>
                  <Choice onClick={() => answerChannel("right")}>{t("pc.ch.right")}</Choice>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  } else if (step === "instructions") {
    body = (
      <div className="space-y-5">
        {back("channels")}
        <h2 className="text-center text-2xl font-bold">{t("pc.ins.title")}</h2>
        <ul className="space-y-3 text-base leading-7">
          {(["pc.ins.body1", "pc.ins.body2", "pc.ins.body3"] as const).map((k) => (
            <li key={k} className="flex gap-3">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <span>{t(k)}</span>
            </li>
          ))}
        </ul>
        <Button
          size="lg"
          className="h-14 w-full rounded-2xl text-lg"
          onClick={async () => {
            await engine.current.context(); // unlock audio within the tap (iOS)
            go("test");
          }}
        >
          {t("pc.ins.start")}
        </Button>
      </div>
    );
  } else if (step === "test") {
    body = (
      <SelfThresholdTest
        key={attempt}
        engine={engine.current}
        sequence={REMOTE_SEQUENCE}
        toDbfs={estToDbfs}
        maxLevel={(_ear, f) => remoteMaxLevel(f)}
        maxDbfs={REMOTE_MAX_DBFS}
        instructions={t("pc.test.instructions")}
        buttonLabel={t("pc.test.button")}
        cancelLabel={t("pc.test.cancel")}
        progress={(d, n) => t("pc.test.progress", d, n)}
        onCancel={() => {
          setAttempt((a) => a + 1);
          go("instructions");
        }}
        onDone={finishTest}
      />
    );
  } else if (step === "result" && assessment) {
    const rec = assessment.recommendation;
    const shownReasons = assessment.reasons.filter((r) => ["asymmetry", "complaints", "reported_worse_ear", "constant_tinnitus", "unreliable"].includes(r));
    body = (
      <div className="space-y-6">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("pc.res.title")}</h2>
        {rec === "urgent" ? (
          urgentBox
        ) : (
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-bold leading-tight">{t(`pc.rec.${rec}.title`)}</h3>
            <p className="leading-7 text-muted-foreground">{t(`pc.rec.${rec}.body`)}</p>
          </div>
        )}
        {(["right", "left"] as const).map((ear) => (
          <div key={ear} className="space-y-2 rounded-2xl border p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className={`text-lg font-bold ${ear === "right" ? "text-red-600" : "text-blue-600"}`}>{t(ear === "right" ? "pc.res.right" : "pc.res.left")}</h4>
              <span className="text-right text-sm font-medium">{t(`pc.cat.${assessment.category[ear]}`)}</span>
            </div>
            <Gauge category={assessment.category[ear]} />
          </div>
        ))}
        {shownReasons.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {shownReasons.map((r) => (
              <li key={r}>{t(`pc.reason.${r}`)}</li>
            ))}
          </ul>
        )}
        <p className="rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">{t("patient.disclaimer")}</p>
        <p className="text-center text-sm">{t("pc.res.send_hint")}</p>
        {error && <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button size="lg" className="h-14 flex-1 rounded-2xl text-lg" onClick={send} disabled={sending}>
            {sending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
            {sending ? t("pc.res.sending") : t("pc.res.send")}
          </Button>
          <Button size="lg" variant="outline" className="h-14 rounded-2xl" onClick={repeatTest} disabled={sending}>
            <RotateCcw className="mr-2 h-5 w-5" />
            {t("pc.res.repeat")}
          </Button>
        </div>
      </div>
    );
  } else if (step === "done") {
    body = (
      <div className="space-y-3 py-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
        <h2 className="text-2xl font-bold">{t("pc.done.title")}</h2>
        <p className="text-muted-foreground">{t("pc.done.body")}</p>
        {flags.length > 0 && <div className="pt-3 text-left">{urgentBox}</div>}
      </div>
    );
  }

  return (
    <Card className="rounded-3xl">
      <CardContent className="px-5 py-6 sm:px-8">{body}</CardContent>
    </Card>
  );
}
