// Full audiometric report editor (from AudiometricReport): patient history, hearing studies
// (audiogram, speech audiometry, impedance) and diagnosis, plus the printable A4 report.
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Loader2, Lock, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";
import PatientHistoryModule from "@/modules/hearing/audiometric/components/ReportModules/PatientHistoryModule";
import StudiesModule from "@/modules/hearing/audiometric/components/ReportModules/StudiesModule";
import DiagnosisModule from "@/modules/hearing/audiometric/components/ReportModules/DiagnosisModule";
import Report from "@/modules/hearing/audiometric/components/App/Report";
import { analyzeDataQuality, calculateAllResults } from "@/modules/hearing/audiometric/utils/calculations";
import {
  CalculationStandard,
  Ear,
  type AudiogramData,
  type Conduction,
  type FullReportData,
  type ImpedanceData,
  type ReportInfo,
  type SpeechAudiometryData,
} from "@/modules/hearing/audiometric/types";
import { pickIdentity, toStoredReport, type PatientIdentity, type StoredReport } from "@/modules/hearing/lib/report";

export interface ReportEditorInitial {
  audiogram: AudiogramData;
  info: ReportInfo;
  speech: SpeechAudiometryData;
  impedance: ImpedanceData;
  standard: CalculationStandard;
}

export interface Professional {
  name: string;
  profession: string;
  license: string;
}

const PRO_KEY = "entsenses.professional";

function loadProfessional(fallback: Professional): Professional {
  try {
    const raw = window.localStorage.getItem(PRO_KEY);
    if (raw) return { ...fallback, ...(JSON.parse(raw) as Partial<Professional>) };
  } catch {
    // ignore
  }
  return fallback;
}

type Tab = "patient" | "studies" | "diagnosis";

export function ReportEditor({
  initial,
  audiogramEditable,
  professionalDefaults,
  banner,
  printNotice,
  onSave,
}: {
  initial: ReportEditorInitial;
  /** False for measurements that must stay as recorded (patient checks, calibrated sessions). */
  audiogramEditable: boolean;
  professionalDefaults: Professional;
  banner?: React.ReactNode;
  /** Legal notice printed at the foot of every report page (e.g. not calibrated). */
  printNotice?: string;
  onSave: (data: { audiogram: AudiogramData; report: StoredReport; identity: PatientIdentity }) => Promise<void>;
}) {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("studies");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [audiogram, setAudiogram] = useState<AudiogramData>(initial.audiogram);
  const [info, setInfo] = useState<ReportInfo>(initial.info);
  const [speech, setSpeech] = useState<SpeechAudiometryData>(initial.speech);
  const [impedance, setImpedance] = useState<ImpedanceData>(initial.impedance);
  const [standard, setStandard] = useState<CalculationStandard>(initial.standard);
  const [pro, setPro] = useState<Professional>(() =>
    typeof window === "undefined" ? professionalDefaults : loadProfessional(professionalDefaults),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(PRO_KEY, JSON.stringify(pro));
    } catch {
      // ignore
    }
  }, [pro]);

  const calculated = useMemo(() => calculateAllResults(audiogram.right, audiogram.left, standard), [audiogram, standard]);
  const errors = useMemo(() => analyzeDataQuality(audiogram), [audiogram]);

  // Age from date of birth (the date itself is never stored).
  useEffect(() => {
    if (!info.fechaNacimiento) return;
    const today = new Date();
    const birth = new Date(info.fechaNacimiento);
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    if (age >= 0) {
      const s = `${age} ${t("report.years")}`;
      if (info.edad !== s) setInfo((p) => ({ ...p, edad: s }));
    }
  }, [info.fechaNacimiento, info.edad, t]);

  const setInfoField = (f: keyof ReportInfo, v: string) => setInfo((p) => ({ ...p, [f]: v }));

  function onDataChange(e: Ear, c: Conduction, f: number, v: string) {
    if (!audiogramEditable) return;
    setAudiogram((prev) => ({ ...prev, [e]: { ...prev[e], [c]: { ...prev[e][c], [f]: v === "" ? null : parseInt(v, 10) } } }));
  }

  function onNrChange(e: Ear, c: Conduction, f: number, isNr: boolean) {
    if (!audiogramEditable) return;
    setAudiogram((prev) => {
      const ear = prev[e];
      const key = c as keyof typeof ear.noResponse;
      return { ...prev, [e]: { ...ear, noResponse: { ...ear.noResponse, [key]: { ...ear.noResponse[key], [f]: isNr } } } };
    });
  }

  async function save() {
    setSaving(true);
    try {
      await onSave({ audiogram, report: toStoredReport(info, speech, impedance, standard), identity: pickIdentity(info) });
    } finally {
      setSaving(false);
    }
  }

  const fullData: FullReportData = {
    reportInfo: { ...info, facultativo: pro.name, profesion: pro.profession, matricula: pro.license, footerText: printNotice ?? "" },
    calculatedValues: calculated,
    audiogram,
    speechAudiometry: speech,
    impedance,
  };

  if (preview) {
    return (
      <div className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0">
        <div className="no-print mx-auto mb-4 flex max-w-[210mm] px-4">
          <Button variant="outline" size="sm" onClick={() => setPreview(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("report.back_to_editor")}
          </Button>
        </div>
        <Report data={fullData} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {banner}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-1 rounded-lg border bg-background p-1">
          {(["patient", "studies", "diagnosis"] as const).map((k) => (
            <Button key={k} size="sm" variant={tab === k ? "default" : "ghost"} onClick={() => setTab(k)}>
              {t(`report.tab.${k}`)}
            </Button>
          ))}
        </nav>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreview(true)}>
            <FileText className="mr-2 h-4 w-4" />
            {t("report.view")}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t("report.save")}
          </Button>
        </div>
      </div>

      {!audiogramEditable && tab === "studies" && (
        <p className="flex items-center gap-2 rounded border bg-muted/50 p-3 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" />
          {t("report.audiogram_locked")}
        </p>
      )}

      <div className="rounded-xl border bg-white p-4 text-slate-900 md:p-6">
        {tab === "patient" && (
          <>
            <p className="mb-4 flex gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {t("report.identity_not_stored")}
            </p>
            <PatientHistoryModule reportInfo={info} onChange={setInfoField} />
          </>
        )}
        {tab === "studies" && (
          <StudiesModule
            audiogramData={audiogram}
            speechData={speech}
            impedanceData={impedance}
            onDataChange={onDataChange}
            onNrChange={onNrChange}
            onSpeechDataChange={(ear, field, value, subfield) =>
              setSpeech((prev) => {
                const e = { ...prev[ear] } as any;
                e[field] = subfield ? { ...e[field], [subfield]: value } : value;
                return { ...prev, [ear]: e };
              })
            }
            onImpedanceTympChange={(ear, field, value) =>
              setImpedance((p) => ({ ...p, [ear]: { ...p[ear], tymp: { ...p[ear].tymp, [field]: value } } }))
            }
            onImpedanceReflexChange={(ear, type, freq, value) =>
              setImpedance((p) => ({ ...p, [ear]: { ...p[ear], reflex: { ...p[ear].reflex, [type]: { ...p[ear].reflex[type], [freq]: value } } } }))
            }
            onImpedanceReflexAbsentChange={(ear, type, freq, v) =>
              setImpedance((p) => ({
                ...p,
                [ear]: { ...p[ear], reflex: { ...p[ear].reflex, absent: { ...p[ear].reflex.absent, [type]: { ...p[ear].reflex.absent[type], [freq]: v } } } },
              }))
            }
            onImpedanceReflexPresentChange={(ear, type, freq, v) =>
              setImpedance((p) => ({
                ...p,
                [ear]: { ...p[ear], reflex: { ...p[ear].reflex, present: { ...p[ear].reflex.present, [type]: { ...p[ear].reflex.present[type], [freq]: v } } } },
              }))
            }
            onImpedanceDecayChange={(ear, freq, value) =>
              setImpedance((p) => ({ ...p, [ear]: { ...p[ear], reflex: { ...p[ear].reflex, decay: { ...p[ear].reflex.decay, [freq]: value } } } }))
            }
            calculatedValues={calculated}
            dataErrors={errors}
            calculationStandard={standard}
            onCalculationStandardChange={setStandard}
          />
        )}
        {tab === "diagnosis" && (
          <div className="space-y-6">
            <DiagnosisModule reportInfo={info} onChange={setInfoField} handleLocationChange={(v) => setInfoField("lugarFirma", v)} />
            <div className="grid gap-4 border-t pt-5 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>{t("report.pro.name")}</Label>
                <Input value={pro.name} onChange={(e) => setPro({ ...pro, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("report.pro.profession")}</Label>
                <Input value={pro.profession} onChange={(e) => setPro({ ...pro, profession: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("report.pro.license")}</Label>
                <Input value={pro.license} onChange={(e) => setPro({ ...pro, license: e.target.value })} />
              </div>
              <p className="text-xs text-muted-foreground md:col-span-3">{t("report.pro.hint")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
