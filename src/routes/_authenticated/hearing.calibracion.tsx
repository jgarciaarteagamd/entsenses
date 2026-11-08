import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Archive, ArchiveRestore, Gauge, Loader2, Pencil, Play, Plus, Square } from "lucide-react";
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
import {
  DEFAULT_MAX_DBFS,
  DEFAULT_REFERENCE_DBFS,
  FREQUENCIES,
  calibratedFrequencies,
  emptyPerEar,
  isProfileUsable,
  maxHl,
  zerosFromMeasurements,
  type EarSide,
  type PerEar,
} from "@/modules/hearing/audio/levels";
import { RETSPL_PRESETS } from "@/modules/hearing/audio/retspl";
import { ToneEngine } from "@/modules/hearing/audio/toneEngine";
import { listProfiles, saveProfile, setArchived, type CalibrationProfile } from "@/modules/hearing/lib/calibration";

export const Route = createFileRoute("/_authenticated/hearing/calibracion")({
  component: CalibrationPage,
});

const today = () => new Date().toISOString().slice(0, 10);
const inAYear = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

function newProfile(): Omit<CalibrationProfile, "id"> & { id?: string } {
  return {
    name: "",
    transducer_model: RETSPL_PRESETS.dd45.label,
    transducer_serial: "",
    interface_model: "",
    technician: "",
    notes: "",
    method: "objective",
    reference_dbfs: DEFAULT_REFERENCE_DBFS,
    max_dbfs: DEFAULT_MAX_DBFS,
    retspl: { ...RETSPL_PRESETS.dd45.values },
    measured_spl: emptyPerEar(),
    zero_hl: emptyPerEar(),
    calibrated_at: today(),
    valid_until: inAYear(),
    archived: false,
  };
}

function CalibrationPage() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const { data: profiles, isLoading } = useQuery({ queryKey: ["hearing-calibration"], queryFn: listProfiles });
  const [editing, setEditing] = useState<(Omit<CalibrationProfile, "id"> & { id?: string }) | null>(null);
  const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString(lang === "en" ? "en-GB" : "es-ES");
  const refresh = () => qc.invalidateQueries({ queryKey: ["hearing-calibration"] });

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <HearingNav />
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Gauge className="h-6 w-6" />
          {t("cal.title")}
        </h1>
        <p className="mb-4 text-sm text-muted-foreground">{t("cal.subtitle")}</p>
        <p className="mb-6 flex gap-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {t("cal.warning")}
        </p>

        {editing ? (
          <ProfileEditor
            initial={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              refresh();
            }}
          />
        ) : (
          <>
            <Button onClick={() => setEditing(newProfile())} className="mb-4">
              <Plus className="mr-2 h-4 w-4" />
              {t("cal.new")}
            </Button>
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {!isLoading && (profiles ?? []).length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">{t("cal.empty")}</CardContent>
              </Card>
            )}
            <div className="space-y-3">
              {(profiles ?? []).map((p) => {
                const usable = isProfileUsable(p);
                const expired = p.valid_until < today();
                return (
                  <Card key={p.id} className={p.archived ? "opacity-60" : ""}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                      <div className="min-w-0">
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[p.transducer_model, p.transducer_serial, p.interface_model].filter(Boolean).join(" · ")}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {p.archived ? (
                            <Badge variant="outline">{t("cal.archived")}</Badge>
                          ) : expired ? (
                            <Badge variant="destructive">{t("cal.expired", fmt(p.valid_until))}</Badge>
                          ) : (
                            <Badge variant="outline" className={usable ? "border-emerald-300 bg-emerald-50 text-emerald-800" : ""}>
                              {usable ? t("cal.valid_until", fmt(p.valid_until)) : t("cal.not_ready")}
                            </Badge>
                          )}
                          <Badge variant="outline">{t("cal.freqs", calibratedFrequencies(p.zero_hl).length)}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          {t("cal.edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await setArchived(p.id, !p.archived);
                            refresh();
                          }}
                        >
                          {p.archived ? <ArchiveRestore className="mr-1 h-3.5 w-3.5" /> : <Archive className="mr-1 h-3.5 w-3.5" />}
                          {p.archived ? t("cal.unarchive") : t("cal.archive")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function NumberCell({ value, onChange, step = 0.5, width = "w-24" }: { value: number | undefined; onChange: (v: number | undefined) => void; step?: number; width?: string }) {
  return (
    <Input
      type="number"
      step={step}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      className={`h-8 ${width} text-right tabular-nums`}
    />
  );
}

function ProfileEditor({
  initial,
  onCancel,
  onSaved,
}: {
  initial: Omit<CalibrationProfile, "id"> & { id?: string };
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { t } = useLang();
  const [p, setP] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const engine = useRef<ToneEngine | null>(null);
  const set = <K extends keyof typeof p>(k: K, v: (typeof p)[K]) => setP((x) => ({ ...x, [k]: v }));

  useEffect(() => () => engine.current?.stop(), []);

  const zero: PerEar = useMemo(
    () => (p.method === "objective" ? zerosFromMeasurements(p.reference_dbfs, p.measured_spl, p.retspl) : p.zero_hl),
    [p.method, p.reference_dbfs, p.measured_spl, p.retspl, p.zero_hl],
  );

  async function toggleTone(ear: EarSide, f: number) {
    engine.current ??= new ToneEngine();
    const key = `${ear}-${f}`;
    if (playing === key) {
      engine.current.stop();
      setPlaying(null);
      return;
    }
    await engine.current.startReference({ frequency: f, ear, dbfs: p.reference_dbfs, maxDbfs: Math.max(p.reference_dbfs, p.max_dbfs) });
    setPlaying(key);
  }

  function setMeasured(ear: EarSide, f: number, v: number | undefined) {
    setP((x) => ({ ...x, measured_spl: { ...x.measured_spl, [ear]: { ...x.measured_spl[ear], [f]: v } } }));
  }
  function setZero(ear: EarSide, f: number, v: number | undefined) {
    setP((x) => ({ ...x, zero_hl: { ...x.zero_hl, [ear]: { ...x.zero_hl[ear], [f]: v } } }));
  }

  async function save() {
    if (!p.name.trim()) return toast.error(t("cal.name_required"));
    engine.current?.stop();
    setPlaying(null);
    setSaving(true);
    try {
      const clean = (x: PerEar): PerEar => ({
        right: Object.fromEntries(Object.entries(x.right).filter(([, v]) => typeof v === "number")),
        left: Object.fromEntries(Object.entries(x.left).filter(([, v]) => typeof v === "number")),
      });
      await saveProfile({ ...p, name: p.name.trim(), measured_spl: clean(p.measured_spl), zero_hl: clean(zero) });
      toast.success(t("cal.saved"));
      onSaved();
    } catch (e) {
      console.error("[calibration save]", e);
      toast.error(t("cal.error"));
    } finally {
      setSaving(false);
    }
  }

  const ears: EarSide[] = ["right", "left"];
  const earShort = (e: EarSide) => t(e === "right" ? "hearing.ear.right_short" : "hearing.ear.left_short");

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("cal.name")}</Label>
            <Input value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="DD45 consulta Huelva" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("cal.model")}</Label>
            <Input value={p.transducer_model ?? ""} onChange={(e) => set("transducer_model", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("cal.serial")}</Label>
            <Input value={p.transducer_serial ?? ""} onChange={(e) => set("transducer_serial", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("cal.interface")}</Label>
            <Input value={p.interface_model ?? ""} onChange={(e) => set("interface_model", e.target.value)} placeholder="Focusrite Scarlett 2i2 · macOS 100 % · mando a las 12" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("cal.technician")}</Label>
            <Input value={p.technician ?? ""} onChange={(e) => set("technician", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("cal.calibrated_at")}</Label>
              <Input type="date" value={p.calibrated_at} onChange={(e) => set("calibrated_at", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("cal.valid_until_label")}</Label>
              <Input type="date" value={p.valid_until} onChange={(e) => set("valid_until", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label>{t("cal.method")}</Label>
            <div className="flex gap-1 rounded-lg border p-1">
              {(["objective", "manual"] as const).map((m) => (
                <Button key={m} size="sm" variant={p.method === m ? "default" : "ghost"} onClick={() => set("method", m)}>
                  {t(`cal.method.${m}`)}
                </Button>
              ))}
            </div>
          </div>
          {p.method === "objective" && (
            <div className="space-y-1.5">
              <Label>{t("cal.reference")}</Label>
              <NumberCell value={p.reference_dbfs} onChange={(v) => set("reference_dbfs", v ?? DEFAULT_REFERENCE_DBFS)} step={1} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>{t("cal.max_dbfs")}</Label>
            <NumberCell value={p.max_dbfs} onChange={(v) => set("max_dbfs", v ?? DEFAULT_MAX_DBFS)} step={1} />
          </div>
          {p.method === "objective" &&
            Object.entries(RETSPL_PRESETS).map(([k, preset]) => (
              <Button key={k} size="sm" variant="outline" onClick={() => set("retspl", { ...preset.values })}>
                {t("cal.load_retspl", preset.label)}
              </Button>
            ))}
        </div>

        <p className="text-sm text-muted-foreground">{p.method === "objective" ? t("cal.objective_help") : t("cal.manual_help")}</p>
        {p.method === "objective" && <p className="text-xs text-amber-800">{t("cal.retspl_note")}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">{t("cal.col.freq")}</th>
                {p.method === "objective" && <th className="py-2 pr-3">{t("cal.col.retspl")}</th>}
                {p.method === "objective" && ears.map((e) => <th key={`m-${e}`} className="py-2 pr-3">{t("cal.col.measured", earShort(e))}</th>)}
                {ears.map((e) => <th key={`z-${e}`} className="py-2 pr-3">{t("cal.col.zero", earShort(e))}</th>)}
                <th className="py-2 pr-3">{t("cal.col.max")}</th>
              </tr>
            </thead>
            <tbody>
              {FREQUENCIES.map((f) => {
                const maxes = ears.map((e) => maxHl(zero[e][f], p.max_dbfs)).filter((x): x is number => x !== null);
                return (
                  <tr key={f} className="border-t">
                    <td className="py-1.5 pr-3 font-medium tabular-nums">{f} Hz</td>
                    {p.method === "objective" && (
                      <td className="py-1.5 pr-3">
                        <NumberCell value={p.retspl[f]} onChange={(v) => set("retspl", { ...p.retspl, [f]: v })} width="w-20" />
                      </td>
                    )}
                    {p.method === "objective" &&
                      ears.map((e) => (
                        <td key={`m-${e}`} className="py-1.5 pr-3">
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant={playing === `${e}-${f}` ? "default" : "outline"}
                              className={`h-8 w-8 ${e === "right" ? "text-red-600" : "text-blue-600"} ${playing === `${e}-${f}` ? "text-white" : ""}`}
                              onClick={() => toggleTone(e, f)}
                              aria-label="tone"
                            >
                              {playing === `${e}-${f}` ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </Button>
                            <NumberCell value={p.measured_spl[e][f]} onChange={(v) => setMeasured(e, f, v)} width="w-20" />
                          </div>
                        </td>
                      ))}
                    {ears.map((e) => (
                      <td key={`z-${e}`} className="py-1.5 pr-3 tabular-nums">
                        {p.method === "manual" ? (
                          <NumberCell value={p.zero_hl[e][f]} onChange={(v) => setZero(e, f, v)} width="w-20" />
                        ) : (
                          (zero[e][f]?.toFixed(1) ?? "—")
                        )}
                      </td>
                    ))}
                    <td className="py-1.5 pr-3 tabular-nums">{maxes.length ? Math.min(...maxes) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-1.5">
          <Label>{t("cal.notes")}</Label>
          <Textarea value={p.notes ?? ""} onChange={(e) => set("notes", e.target.value.slice(0, 2000))} rows={3} />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => { engine.current?.stop(); onCancel(); }}>
            {t("cal.cancel")}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("cal.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
