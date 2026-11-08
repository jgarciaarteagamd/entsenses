import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bot, CheckCircle2, Hand, Headphones, Loader2, Minus, Pause, Play, Plus, Save, Square, Tag, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HearingNav } from "@/modules/hearing/components/HearingNav";
import { useLang } from "@/modules/hearing/i18n";
import AudiogramChart from "@/modules/hearing/audiometric/components/AudiogramChart";
import { Ear as EarEnum } from "@/modules/hearing/audiometric/types";
import { HIGH_LEVEL_HL, HL_STEP, calibratedFrequencies, hlToDbfs, isProfileUsable, maxHl, stepLevel, type EarSide } from "@/modules/hearing/audio/levels";
import { ToneEngine, type ToneMode } from "@/modules/hearing/audio/toneEngine";
import { HughsonWestlake, type AutoResults, type AutoStep } from "@/modules/hearing/audio/hughsonWestlake";
import { loadPatientKey, savePatientKey, usePatientButton } from "@/modules/hearing/audio/patientButton";
import { checkedOkToday, lastDailyCheck, listProfiles, recordDailyCheck, type CalibrationProfile } from "@/modules/hearing/lib/calibration";
import { compactAudiogram, emptyAudiogram } from "@/modules/hearing/lib/report";
import { submitDoctorSession } from "@/modules/hearing/lib/sessions";

export const Route = createFileRoute("/_authenticated/hearing/audiometro")({
  component: AudiometerPage,
});

type Threshold = { level: number } | { noResponse: true };
type Thresholds = Record<EarSide, Partial<Record<number, Threshold>>>;
/** Octave order recommended by ISO 8253-1; "1000r" is the 1 kHz retest. */
const ORDER = [1000, 2000, 4000, 8000, "1000r", 500, 250, 125] as const;
const RESPONSE_WINDOW_MS = 1500;
/** Random pause between automatic presentations, so the patient cannot predict the rhythm. */
const ISI_MIN_MS = 1200;
const ISI_MAX_MS = 2800;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Duration of a presentation (used for silent catch trials). */
const toneMs = (mode: ToneMode) => (mode === "pulsed" ? 1350 : 1500);
const CHECK_LEVEL_HL = 30;

function AudiometerPage() {
  const { t } = useLang();
  const { data: profiles, isLoading } = useQuery({ queryKey: ["hearing-calibration"], queryFn: listProfiles });
  const usable = (profiles ?? []).filter((p) => isProfileUsable(p));
  const [profileId, setProfileId] = useState<string | null>(null);
  const profile = usable.find((p) => p.id === profileId) ?? usable[0] ?? null;

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <HearingNav />
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Headphones className="h-6 w-6" />
          {t("aud.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("aud.subtitle")}</p>
        <p className="mb-6 mt-3 flex gap-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {t("aud.notice")}
        </p>

        {isLoading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        {!isLoading && !profile && (
          <Card>
            <CardContent className="space-y-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">{t("aud.no_profile")}</p>
              <Button asChild>
                <Link to="/hearing/calibracion">{t("hearing.nav.calibration")}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        {profile && (
          <>
            {usable.length > 1 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Label>{t("aud.profile")}</Label>
                {usable.map((p) => (
                  <Button key={p.id} size="sm" variant={p.id === profile.id ? "default" : "outline"} onClick={() => setProfileId(p.id)}>
                    {p.name}
                  </Button>
                ))}
              </div>
            )}
            <Gate profile={profile} />
          </>
        )}
      </main>
    </div>
  );
}

/** Requires today's daily check before the audiometer can be used. */
function Gate({ profile }: { profile: CalibrationProfile }) {
  const { t } = useLang();
  const qc = useQueryClient();
  const { data: check, isLoading } = useQuery({ queryKey: ["hearing-daily-check", profile.id], queryFn: () => lastDailyCheck(profile.id) });
  const engine = useMemo(() => new ToneEngine(), []);
  const [notes, setNotes] = useState("");
  useEffect(() => () => engine.stop(), [engine]);

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;
  if (checkedOkToday(check ?? null)) return <Audiometer profile={profile} engine={engine} />;

  const freqs = calibratedFrequencies(profile.zero_hl);
  async function record(ok: boolean) {
    await recordDailyCheck(profile.id, ok, notes.trim() || null);
    toast.success(t("check.recorded"));
    void qc.invalidateQueries({ queryKey: ["hearing-daily-check", profile.id] });
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h2 className="text-lg font-semibold">{t("check.title")}</h2>
        {check && !check.ok && <p className="text-sm font-medium text-destructive">{t("check.failed")}</p>}
        <p className="text-sm text-muted-foreground">{t("aud.need_check")} {t("check.help")}</p>
        {(["right", "left"] as const).map((ear) => (
          <div key={ear} className="flex flex-wrap items-center gap-1.5">
            <span className={`w-28 text-sm font-semibold ${ear === "right" ? "text-red-600" : "text-blue-600"}`}>
              {t(ear === "right" ? "hearing.ear.right" : "hearing.ear.left")}
            </span>
            {freqs.map((f) => (
              <Button
                key={f}
                size="sm"
                variant="outline"
                onClick={() =>
                  engine.present({ frequency: f, ear, dbfs: hlToDbfs(CHECK_LEVEL_HL, profile.zero_hl[ear][f]!), maxDbfs: profile.max_dbfs, mode: "pulsed" })
                }
              >
                <Play className="mr-1 h-3 w-3" />
                {f >= 1000 ? `${f / 1000}k` : f}
              </Button>
            ))}
          </div>
        ))}
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 500))} rows={2} placeholder="…" />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => record(true)}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {t("check.ok")}
          </Button>
          <Button variant="outline" onClick={() => record(false)}>
            <XCircle className="mr-2 h-4 w-4" />
            {t("check.fail")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Audiometer({ profile, engine }: { profile: CalibrationProfile; engine: ToneEngine }) {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const freqs = calibratedFrequencies(profile.zero_hl);
  const [ear, setEar] = useState<EarSide>("right");
  const [freq, setFreq] = useState<number>(freqs.includes(1000) ? 1000 : freqs[0]);
  const [level, setLevel] = useState(30);
  const [mode, setMode] = useState<ToneMode>("pulsed");
  const [presenting, setPresenting] = useState(false);
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const [thresholds, setThresholds] = useState<Thresholds>({ right: {}, left: {} });
  const [retest, setRetest] = useState<Partial<Record<EarSide, number>>>({});
  const [retestMode, setRetestMode] = useState(false);
  const [falsePositives, setFalsePositives] = useState(0);
  const [presentations, setPresentations] = useState(0);
  const [patientKey, setPatientKey] = useState(() => (typeof window === "undefined" ? "Space" : loadPatientKey()));
  const [capturing, setCapturing] = useState(false);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const windowOpen = useRef(false);
  const responded = useRef(false);
  // Automatic procedure
  const [tab, setTab] = useState<"manual" | "auto">("manual");
  const [autoFirstEar, setAutoFirstEar] = useState<EarSide>("right");
  const [autoCatch, setAutoCatch] = useState(true);
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const [autoStep, setAutoStep] = useState<AutoStep | null>(null);
  const [autoResults, setAutoResults] = useState<AutoResults | null>(null);
  const stopRef = useRef(false);
  const pauseRef = useRef(false);
  const runningRef = useRef(false);

  const zero = profile.zero_hl[ear][freq];
  const max = maxHl(zero, profile.max_dbfs);

  useEffect(() => {
    if (max !== null && level > max) setLevel(max);
  }, [max, level]);

  const onPatientPress = useCallback(() => {
    if (windowOpen.current) responded.current = true;
    else setFalsePositives((n) => n + 1);
  }, []);
  const pressed = usePatientButton(capturing ? "__capturing__" : patientKey, onPatientPress);

  useEffect(() => {
    if (!capturing) return;
    const h = (e: KeyboardEvent) => {
      e.preventDefault();
      savePatientKey(e.code);
      setPatientKey(e.code);
      setCapturing(false);
    };
    window.addEventListener("keydown", h, { once: true });
    return () => window.removeEventListener("keydown", h);
  }, [capturing]);

  /** Presents a tone (or silence, for a catch trial) and reports whether the patient responded. */
  const listen = useCallback(
    async (e: EarSide, f: number, l: number, silent = false): Promise<boolean> => {
      const z = profile.zero_hl[e][f];
      responded.current = false;
      windowOpen.current = true;
      if (silent || z === undefined) await sleep(toneMs(mode));
      else await engine.present({ frequency: f, ear: e, dbfs: hlToDbfs(l, z), maxDbfs: profile.max_dbfs, mode });
      await sleep(RESPONSE_WINDOW_MS);
      windowOpen.current = false;
      return responded.current;
    },
    [engine, mode, profile],
  );

  const present = useCallback(async () => {
    if (presenting || zero === undefined) return;
    setPresenting(true);
    setLastResult(null);
    setPresentations((n) => n + 1);
    setLastResult(await listen(ear, freq, level));
    setPresenting(false);
  }, [presenting, zero, listen, freq, ear, level]);

  const toThresholds = (r: AutoResults): Thresholds => ({
    right: Object.fromEntries(Object.entries(r.thresholds.right).map(([f, x]) => [f, x && "level" in x ? { level: x.level } : { noResponse: true as const }])),
    left: Object.fromEntries(Object.entries(r.thresholds.left).map(([f, x]) => [f, x && "level" in x ? { level: x.level } : { noResponse: true as const }])),
  });

  async function runAuto() {
    const runner = new HughsonWestlake({
      ears: autoFirstEar === "right" ? ["right", "left"] : ["left", "right"],
      frequencies: freqs,
      maxLevel: (e, f) => maxHl(profile.zero_hl[e][f], profile.max_dbfs),
      catchRate: autoCatch ? 0.12 : 0,
    });
    stopRef.current = false;
    pauseRef.current = false;
    runningRef.current = true;
    setAutoRunning(true);
    setAutoPaused(false);
    setAutoResults(runner.results);
    setThresholds({ right: {}, left: {} });
    setRetest({});
    while (!runner.done && !stopRef.current) {
      while (pauseRef.current && !stopRef.current) await sleep(200);
      if (stopRef.current) break;
      const step = runner.next()!;
      setAutoStep(step);
      setEar(step.ear);
      setFreq(step.frequency);
      setLevel(step.level);
      const answer = await listen(step.ear, step.frequency, step.level, step.catchTrial);
      if (stopRef.current) break;
      runner.record(answer);
      setLastResult(step.catchTrial ? null : answer);
      setAutoResults({ ...runner.results });
      setThresholds(toThresholds(runner.results));
      setRetest({ ...runner.results.retest });
      await sleep(ISI_MIN_MS + Math.random() * (ISI_MAX_MS - ISI_MIN_MS));
    }
    engine.stop();
    runningRef.current = false;
    setAutoRunning(false);
    setAutoStep(null);
    if (runner.done) toast.success(t("auto.finished"));
  }

  function advance(currentEar: EarSide, currentFreq: number, wasRetest: boolean) {
    const key = wasRetest ? "1000r" : currentFreq;
    const idx = ORDER.indexOf(key as (typeof ORDER)[number]);
    const next = idx >= 0 ? ORDER.slice(idx + 1).find((x) => x === "1000r" || (freqs as number[]).includes(x)) : undefined;
    if (next === "1000r") {
      setRetestMode(true);
      setFreq(1000);
    } else if (typeof next === "number") {
      setRetestMode(false);
      setFreq(next);
    } else {
      setRetestMode(false);
      const other: EarSide = currentEar === "right" ? "left" : "right";
      if (Object.keys(thresholds[other]).length === 0) {
        setEar(other);
        setFreq(freqs.includes(1000) ? 1000 : freqs[0]);
      }
    }
    setLevel(30);
    setLastResult(null);
  }

  function mark(noResponse = false) {
    if (retestMode && freq === 1000 && !noResponse) {
      setRetest((r) => ({ ...r, [ear]: level }));
    } else {
      setThresholds((th) => ({ ...th, [ear]: { ...th[ear], [freq]: noResponse ? { noResponse: true } : { level } } }));
    }
    advance(ear, freq, retestMode && freq === 1000);
  }

  // Doctor shortcuts (ignored while typing or when the key is the patient button).
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (runningRef.current || capturing || e.code === patientKey || (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      const i = freqs.indexOf(freq as (typeof freqs)[number]);
      if (e.key === "ArrowRight" && i < freqs.length - 1) setFreq(freqs[i + 1]);
      else if (e.key === "ArrowLeft" && i > 0) setFreq(freqs[i - 1]);
      else if (e.key === "ArrowUp") setLevel((l) => stepLevel(l, HL_STEP, max));
      else if (e.key === "ArrowDown") setLevel((l) => stepLevel(l, -HL_STEP, max));
      else if (e.key.toLowerCase() === "p") void present();
      else if (e.key.toLowerCase() === "m") mark();
      else if (e.key.toLowerCase() === "n" && max !== null && level >= max) mark(true);
      else if (e.key.toLowerCase() === "e") setEar((x) => (x === "right" ? "left" : "right"));
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const audiogram = useMemo(() => {
    const a = emptyAudiogram();
    for (const e of ["right", "left"] as const) {
      for (const [f, th] of Object.entries(thresholds[e])) {
        if (!th) continue;
        if ("level" in th) a[e].air[Number(f)] = th.level;
        else {
          a[e].air[Number(f)] = maxHl(profile.zero_hl[e][Number(f)], profile.max_dbfs);
          a[e].noResponse.air[Number(f)] = true;
        }
      }
    }
    return a;
  }, [thresholds, profile]);

  const maskingFreqs = freqs.filter((f) => {
    const r = thresholds.right[f];
    const l = thresholds.left[f];
    return r && l && "level" in r && "level" in l && Math.abs(r.level - l.level) >= 40;
  });
  const retestDiffs = (["right", "left"] as const)
    .map((e) => {
      const first = thresholds[e][1000];
      return retest[e] !== undefined && first && "level" in first ? Math.abs(retest[e]! - first.level) : null;
    })
    .filter((x): x is number => x !== null);

  async function save() {
    const any = Object.keys(thresholds.right).length + Object.keys(thresholds.left).length;
    if (!any) return toast.error(t("aud.empty"));
    setSaving(true);
    try {
      const warnings = [...maskingFreqs.map((f) => `masking_needed_${f}`), ...(autoResults?.warnings ?? [])];
      if (autoResults) warnings.push("procedure_automatic");
      const id = await submitDoctorSession(
        {
          info: { sex: "unspecified", ageGroup: "unspecified", lang },
          device: {
            entry: "audiometer",
            transducer: "supra-aural",
            connection: "wired",
            model: profile.transducer_model ?? undefined,
            calibrationProfileId: profile.id,
          },
          audiogram: compactAudiogram(audiogram),
          quality: {
            retest1kDb: retestDiffs.length ? Math.max(...retestDiffs) : undefined,
            falsePositiveRate:
              autoResults && autoResults.catchTrials > 0
                ? Math.round((autoResults.falsePositives / autoResults.catchTrials) * 100) / 100
                : presentations
                  ? Math.round((falsePositives / presentations) * 100) / 100
                  : undefined,
            warnings,
          },
        },
        { calibrated: true, label },
      );
      engine.stop();
      void qc.invalidateQueries({ queryKey: ["sessions"] });
      toast.success(t("aud.saved"));
      navigate({ to: "/hearing/informe/$id", params: { id } });
    } catch (e) {
      console.error("[audiometer save]", e);
      toast.error(t("aud.save_error"));
    } finally {
      setSaving(false);
    }
  }

  const earColor = ear === "right" ? "text-red-600" : "text-blue-600";
  const current = thresholds[ear][freq];

  return (
    <div className="space-y-5">
      <p className="flex items-center gap-2 text-sm text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        {t("check.done")} · {profile.name}
      </p>
      <div className="flex flex-wrap gap-1 rounded-lg border bg-background p-1 sm:w-fit">
        {(["manual", "auto"] as const).map((m) => (
          <Button key={m} size="sm" variant={tab === m ? "default" : "ghost"} onClick={() => !autoRunning && setTab(m)} disabled={autoRunning && tab !== m}>
            {m === "manual" ? <Hand className="mr-1.5 h-4 w-4" /> : <Bot className="mr-1.5 h-4 w-4" />}
            {t(`auto.tab.${m}`)}
          </Button>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card>
          {tab === "auto" ? (
            <CardContent className="space-y-5 pt-6">
              <p className="text-sm text-muted-foreground">{t("auto.help")}</p>
              <p className="rounded border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950">{t("auto.patient_instructions")}</p>
              <div className="space-y-1.5">
                <Label>{t("auto.first_ear")}</Label>
                <div className="flex gap-2">
                  {(["right", "left"] as const).map((e) => (
                    <Button key={e} size="sm" disabled={autoRunning} variant={autoFirstEar === e ? "default" : "outline"} onClick={() => setAutoFirstEar(e)}>
                      {t(e === "right" ? "hearing.ear.right" : "hearing.ear.left")}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Label>{t("aud.mode")}</Label>
                {(["pulsed", "warble"] as const).map((m) => (
                  <Button key={m} size="sm" disabled={autoRunning} variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>
                    {t(`aud.mode.${m}`)}
                  </Button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={autoCatch} disabled={autoRunning} onChange={(e) => setAutoCatch(e.target.checked)} />
                {t("auto.catch")}
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {!autoRunning ? (
                  <Button size="lg" onClick={() => void runAuto()}>
                    <Play className="mr-2 h-4 w-4" />
                    {autoResults ? t("auto.restart") : t("auto.start")}
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        pauseRef.current = !pauseRef.current;
                        setAutoPaused(pauseRef.current);
                      }}
                    >
                      {autoPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                      {autoPaused ? t("auto.resume") : t("auto.pause")}
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={() => {
                        stopRef.current = true;
                        engine.stop();
                      }}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      {t("auto.stop")}
                    </Button>
                  </>
                )}
                <span
                  className={`h-10 w-10 rounded-full border-4 transition ${pressed ? "border-emerald-600 bg-emerald-400" : "border-muted bg-background"}`}
                  title={t("aud.button")}
                />
              </div>
              {autoStep && (
                <div className="rounded border p-3">
                  <p className={`text-sm font-semibold ${autoStep.ear === "right" ? "text-red-600" : "text-blue-600"}`}>
                    {t(autoStep.ear === "right" ? "hearing.ear.right" : "hearing.ear.left")} · {autoStep.frequency} Hz
                    {autoStep.retest ? ` · ${t("aud.retest")}` : ""}
                  </p>
                  <p className="text-3xl font-bold tabular-nums">
                    {autoStep.catchTrial ? t("auto.catch_trial") : `${autoStep.level} dB HL`}
                  </p>
                  {autoPaused && <Badge variant="outline">{t("auto.paused")}</Badge>}
                </div>
              )}
              {autoResults && (
                <div className="space-y-1 rounded border bg-muted/40 p-3 text-xs text-muted-foreground">
                  <p>{t("auto.stats", autoResults.presentations, autoResults.catchTrials, autoResults.falsePositives)}</p>
                  {retestDiffs.length > 0 && <p>{t("aud.retest_diff", Math.max(...retestDiffs))}</p>}
                  {autoResults.warnings.map((w) => (
                    <p key={w} className="font-medium text-amber-800">
                      {t(
                        `auto.warn.${w.startsWith("unreliable") ? "unreliable" : w.startsWith("retest") ? "retest" : w}`,
                        w
                          .split("_")
                          .slice(1)
                          .map((x) => (x === "right" ? t("hearing.ear.right_short") : x === "left" ? t("hearing.ear.left_short") : x === "high" || x === "positives" ? "" : `${x} Hz`))
                          .join(" ")
                          .trim(),
                      )}
                    </p>
                  ))}
                  <p>{t("aud.button_key", patientKey)}</p>
                </div>
              )}
            </CardContent>
          ) : (
          <CardContent className="space-y-5 pt-6">
            <div className="flex gap-2">
              {(["right", "left"] as const).map((e) => (
                <Button
                  key={e}
                  variant={ear === e ? "default" : "outline"}
                  className={ear === e ? (e === "right" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700") : ""}
                  onClick={() => setEar(e)}
                >
                  {t(e === "right" ? "hearing.ear.right" : "hearing.ear.left")}
                </Button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>{t("aud.frequency")}</Label>
              <div className="flex flex-wrap gap-1">
                {freqs.map((f) => {
                  const done = thresholds[ear][f];
                  return (
                    <Button key={f} size="sm" variant={f === freq ? "default" : "outline"} onClick={() => setFreq(f)} className="relative tabular-nums">
                      {f >= 1000 ? `${f / 1000}k` : f}
                      {done && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />}
                    </Button>
                  );
                })}
              </div>
              {retestMode && freq === 1000 && <Badge variant="outline">{t("aud.retest")}</Badge>}
            </div>

            <div className="flex items-center gap-4">
              <Button size="icon" variant="outline" onClick={() => setLevel((l) => stepLevel(l, -HL_STEP, max))} aria-label="-5">
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <p className={`text-5xl font-bold tabular-nums ${earColor}`}>{level}</p>
                <p className="text-xs text-muted-foreground">dB HL · {max !== null ? t("aud.max", max) : t("aud.not_calibrated_freq")}</p>
              </div>
              <Button size="icon" variant="outline" onClick={() => setLevel((l) => stepLevel(l, HL_STEP, max))} aria-label="+5">
                <Plus className="h-4 w-4" />
              </Button>
              {level >= HIGH_LEVEL_HL && <Badge variant="destructive">{t("aud.high_level")}</Badge>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Label>{t("aud.mode")}</Label>
              {(["pulsed", "continuous", "warble"] as const).map((m) => (
                <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>
                  {t(`aud.mode.${m}`)}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => void present()} disabled={presenting || zero === undefined}>
                {presenting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                {presenting ? t("aud.presenting") : t("aud.present")}
              </Button>
              <span
                className={`h-10 w-10 rounded-full border-4 transition ${pressed ? "border-emerald-600 bg-emerald-400" : "border-muted bg-background"}`}
                title={t("aud.button")}
              />
              {lastResult !== null && (
                <Badge variant="outline" className={lastResult ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-600"}>
                  {lastResult ? t("aud.responded") : t("aud.not_responded")}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => mark()}>
                {t("aud.mark")}
              </Button>
              <Button variant="outline" onClick={() => mark(true)} disabled={max === null || level < max}>
                {t("aud.no_response")}
              </Button>
              {current && (
                <Button
                  variant="ghost"
                  onClick={() => setThresholds((th) => ({ ...th, [ear]: Object.fromEntries(Object.entries(th[ear]).filter(([f]) => Number(f) !== freq)) }))}
                >
                  {t("aud.clear")}
                </Button>
              )}
            </div>

            <div className="space-y-1 rounded border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{t("aud.button")}:</span>
                {capturing ? t("aud.button_capture") : t("aud.button_key", patientKey)}
                {!capturing && (
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setCapturing(true)}>
                    {t("aud.button_change")}
                  </Button>
                )}
              </p>
              <p>{t("aud.false_positives", falsePositives)}</p>
              {retestDiffs.length > 0 && <p>{t("aud.retest_diff", Math.max(...retestDiffs))}</p>}
              {engine.sampleRate && <p>{t("aud.sample_rate", engine.sampleRate)}</p>}
              <p>{t("aud.shortcuts")}</p>
            </div>
          </CardContent>
          )}
        </Card>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="aspect-[4/3] overflow-hidden rounded-xl border border-red-200 bg-white text-slate-900">
              <AudiogramChart ear={EarEnum.Right} data={audiogram.right} />
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-xl border border-blue-200 bg-white text-slate-900">
              <AudiogramChart ear={EarEnum.Left} data={audiogram.left} />
            </div>
          </div>
          {maskingFreqs.map((f) => (
            <p key={f} className="flex gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {t("aud.masking", f)}
            </p>
          ))}
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 pt-6">
              <div className="min-w-48 flex-1 space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  {t("aud.label")}
                </Label>
                <Input value={label} maxLength={60} onChange={(e) => setLabel(e.target.value.slice(0, 60))} placeholder="Ej: J.P. / HC-1234" />
              </div>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {t("aud.save")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
