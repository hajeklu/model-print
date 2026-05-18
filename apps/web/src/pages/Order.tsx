import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SeoHead } from "@/components/SeoHead";
import { useLocale, useFormatLocale } from "@/hooks/useLocale";
import { localizedPath } from "@/i18n/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ModelViewer } from "@/components/ModelViewer";
import { toast } from "sonner";
import { ACCEPTED_EXTS, MAX_FILE_BYTES, getFormatInfo } from "@/lib/format-info";
import {
  parseModel,
  estimateMaterialUsage,
  estimatePrice,
  meetsMinimumPrintSize,
  MIN_PRINT_AXIS_MM,
  scaledBboxMm,
  scaledVolumeCm3,
  smallestScaledAxisMm,
  type ModelStats,
} from "@/lib/parse-model";
import { formatPriceEur } from "@/lib/format-price";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UploadCloud, FileCheck, Loader2, X } from "lucide-react";

const SCALE_OPTIONS: { value: string; hintKey?: "scale1to1Hint" }[] = [
  { value: "1:1", hintKey: "scale1to1Hint" },
  { value: "1:100" },
  { value: "1:200" },
  { value: "1:500" },
];

const COLORS = [
  { id: "white", hex: "#f3f1ec" },
  { id: "black", hex: "#111111" },
  { id: "red", hex: "#d13b2f" },
  { id: "stone", hex: "#a8a29e" },
  { id: "wood", hex: "#8b6f4d" },
  { id: "anthracite", hex: "#2d2d2d" },
  { id: "terracotta", hex: "#c4654a" },
] as const;

function createOrderSchema(messages: { name: string; email: string; consent: string }) {
  return z.object({
    name: z.string().trim().min(2, messages.name).max(200),
    email: z.string().trim().email(messages.email).max(320),
    phone: z.string().trim().max(50).optional(),
    address: z.string().trim().max(500).optional(),
    note: z.string().trim().max(1000).optional(),
    consent: z.literal(true, { errorMap: () => ({ message: messages.consent }) }),
  });
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

interface UploadResponse {
  uploadId: string;
  originalFilename: string;
  sizeBytes: number;
  sha256: string;
}

function isUploadResponse(value: unknown): value is UploadResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "uploadId" in value &&
    typeof value.uploadId === "string"
  );
}

async function readApiError(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  if (!text) {
    return `HTTP ${response.status}`;
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "error" in parsed &&
      typeof parsed.error === "string"
    ) {
      return parsed.error;
    }
  } catch {
    // Fall back to the raw response body below.
  }
  return text;
}

const Order = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locale = useLocale();
  const formatLocale = useFormatLocale();
  const orderSchema = useMemo(
    () =>
      createOrderSchema({
        name: t("validation.name"),
        email: t("validation.email"),
        consent: t("validation.consent"),
      }),
    [t],
  );
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [scale, setScale] = useState("1:100");
  const [color, setColor] = useState("white");
  const [quality, setQuality] = useState("standard");
  const [submitting, setSubmitting] = useState(false);
  const [drag, setDrag] = useState(false);

  const fmt = file ? getFormatInfo(file.name) : null;
  const selectedColor = COLORS.find((c) => c.id === color) ?? COLORS[0];
  const printVolumeCm3 = stats ? scaledVolumeCm3(stats.volumeCm3, scale) : null;
  const printBboxMm = stats ? scaledBboxMm(stats.bboxMm, scale) : null;
  const price = stats ? estimatePrice(stats.volumeCm3, scale) : null;
  const materialEstimate = stats ? estimateMaterialUsage(stats.volumeCm3, scale) : null;

  const scaleAvailability = useMemo(() => {
    const entries = SCALE_OPTIONS.map((option) => [
      option.value,
      !stats || meetsMinimumPrintSize(stats.bboxMm, option.value),
    ] as const);
    return Object.fromEntries(entries) as Record<string, boolean>;
  }, [stats]);

  const unavailableScales = useMemo(
    () => SCALE_OPTIONS.filter((option) => scaleAvailability[option.value] === false).map((o) => o.value),
    [scaleAvailability],
  );

  const hasViableScale = !stats || unavailableScales.length < SCALE_OPTIONS.length;

  useEffect(() => {
    if (!stats || scaleAvailability[scale]) return;
    const fallback = SCALE_OPTIONS.find((option) => scaleAvailability[option.value])?.value;
    if (fallback) setScale(fallback);
  }, [stats, scale, scaleAvailability]);

  useEffect(() => {
    if (!file || !fmt?.parsable) {
      setStats(null);
      return;
    }
    setParsing(true);
    parseModel(file)
      .then((s) => setStats(s))
      .finally(() => setParsing(false));
  }, [file, fmt]);

  const handleFile = useCallback(
    (f: File) => {
      const info = getFormatInfo(f.name);
      if (!info) {
        toast.error(t("toast.unsupportedFormat"), {
          description: t("toast.acceptedFormats", {
            formats: ACCEPTED_EXTS.map((e) => "." + e).join(", "),
          }),
        });
        return;
      }
      if (f.size > MAX_FILE_BYTES) {
        toast.error(t("toast.fileTooLarge"));
        return;
      }
      setFile(f);
      setStats(null);
    },
    [t],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !fmt) {
      toast.error(t("toast.uploadFirst"));
      return;
    }
    const fd = new FormData(e.currentTarget);
    const parsed = orderSchema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone") || undefined,
      address: fd.get("address") || undefined,
      note: fd.get("note") || undefined,
      consent: fd.get("consent") === "on" ? true : false,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? t("validation.form"));
      return;
    }

    setSubmitting(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);

      const uploadRes = await fetch(`${API_BASE_URL}/uploads`, {
        method: "POST",
        body: uploadForm,
      });
      if (!uploadRes.ok) {
        throw new Error(await readApiError(uploadRes));
      }

      const uploadJson: unknown = await uploadRes.json();
      if (!isUploadResponse(uploadJson)) {
        throw new Error("Upload response did not include an upload ID.");
      }

      const orderRes = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          uploadId: uploadJson.uploadId,
          contact: {
            name: parsed.data.name,
            email: parsed.data.email,
            phone: parsed.data.phone,
          },
          address: parsed.data.address,
          notes: parsed.data.note,
          model: {
            fileFormat: fmt.ext,
            fileSizeBytes: file.size,
            scale,
            color,
            quality,
            nozzleMm: quality === "detail" ? 0.2 : 0.4,
            bboxMm: printBboxMm ?? stats?.bboxMm,
            volumeCm3: printVolumeCm3 ?? undefined,
            estimatedMaterialGrams: materialEstimate?.grams,
            estimatedFilamentMeters: materialEstimate?.filamentMeters,
            estimatedPriceEur: price ?? undefined,
          },
        }),
      });
      if (!orderRes.ok) {
        throw new Error(await readApiError(orderRes));
      }

      const orderJson = await orderRes.json().catch(() => undefined);
      const orderId =
        typeof orderJson === "object" &&
        orderJson !== null &&
        "orderId" in orderJson &&
        typeof orderJson.orderId === "string"
          ? orderJson.orderId
          : undefined;

      navigate(localizedPath(locale, "thankYou"), {
        state: { email: parsed.data.email, price, hasEstimate: !!price, orderId },
      });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : t("toast.retry");
      toast.error(t("toast.submitFailed"), { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SeoHead page="order" />
      <SiteHeader />
      <main className="container py-12 md:py-16 flex-1">
        <div className="tag mb-4">{t("order.tag")}</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-2">{t("order.title")}</h1>
        <p className="text-muted-foreground mb-12 max-w-2xl">{t("order.lead")}</p>

        <form onSubmit={submit} className="grid md:grid-cols-5 gap-8">
          {/* LEFT: upload + parameters */}
          <div className="md:col-span-3 space-y-8">
            {/* Uploader */}
            {!file ? (
              <label
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                className={`block border-2 border-dashed p-12 text-center cursor-pointer transition ${
                  drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  type="file"
                  className="hidden"
                  accept={ACCEPTED_EXTS.map((e) => "." + e).join(",")}
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                <div className="font-semibold mb-1">{t("order.dropTitle")}</div>
                <div className="text-sm text-muted-foreground mb-4">{t("order.dropHint")}</div>
                <div className="font-mono text-xs text-muted-foreground">
                  {ACCEPTED_EXTS.map((e) => "." + e).join("  ·  ")}
                </div>
              </label>
            ) : (
              <div className="border border-border bg-card">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileCheck className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="font-mono text-sm truncate">{file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB · .{fmt?.ext}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFile(null); setStats(null); }}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={t("order.remove")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4 space-y-4 font-mono text-xs">
                  <ModelViewer file={file} modelColor={selectedColor.hex} />
                  {parsing && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> {t("order.parsing")}
                    </div>
                  )}
                  {!parsing && stats && printBboxMm && printVolumeCm3 != null && (
                    <div className="grid grid-cols-4 gap-4">
                      <Stat label="X" value={`${printBboxMm.x} mm`} />
                      <Stat label="Y" value={`${printBboxMm.y} mm`} />
                      <Stat label="Z" value={`${printBboxMm.z} mm`} />
                      <Stat label={t("order.volume")} value={`${printVolumeCm3} cm³`} />
                    </div>
                  )}
                  {!parsing && !stats && fmt && !fmt.parsable && (
                    <div className="text-muted-foreground">{t("order.manualFormat", { ext: fmt.ext })}</div>
                  )}
                </div>
              </div>
            )}

            {/* Parameters */}
            <div className="space-y-6">
              <div>
                <Label className="font-mono uppercase text-xs tracking-wider mb-3 block">{t("order.scale")}</Label>
                <TooltipProvider delayDuration={200}>
                  <RadioGroup value={scale} onValueChange={setScale} className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {SCALE_OPTIONS.map((option) => {
                      const available = scaleAvailability[option.value] !== false;
                      const minAxisMm = stats
                        ? smallestScaledAxisMm(stats.bboxMm, option.value)
                        : null;
                      const label = (
                        <label
                          title={
                            available && option.hintKey
                              ? t(`order.${option.hintKey}`)
                              : undefined
                          }
                          className={cn(
                            "min-h-[3.25rem] flex flex-col items-center justify-center border px-2 py-3 text-center font-mono text-sm transition w-full",
                            scale === option.value
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border",
                            available
                              ? "cursor-pointer hover:border-muted-foreground"
                              : "cursor-not-allowed opacity-45 hover:border-border",
                          )}
                        >
                          <RadioGroupItem
                            value={option.value}
                            disabled={!available}
                            className="sr-only"
                          />
                          {option.value}
                        </label>
                      );

                      if (!available && minAxisMm != null) {
                        return (
                          <Tooltip key={option.value}>
                            <TooltipTrigger asChild>
                              <span className="inline-flex w-full">{label}</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs text-center">
                              {t("order.scaleTooSmallOption", {
                                scale: option.value,
                                minMm: minAxisMm.toFixed(2),
                                min: MIN_PRINT_AXIS_MM,
                              })}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return (
                        <div key={option.value} className="contents">
                          {label}
                        </div>
                      );
                    })}
                  </RadioGroup>
                </TooltipProvider>
                <p className="text-xs text-muted-foreground mt-2 min-h-[2.5rem]">
                  {!hasViableScale
                    ? t("order.scaleNoViableScale", { min: MIN_PRINT_AXIS_MM })
                    : scale === "1:1"
                      ? t("order.scale1to1Hint")
                      : unavailableScales.length > 0
                        ? t("order.scaleSomeUnavailable", {
                            scales: unavailableScales.join(", "),
                            min: MIN_PRINT_AXIS_MM,
                          })
                        : "\u00a0"}
                </p>
              </div>

              <div>
                <Label className="font-mono uppercase text-xs tracking-wider mb-3 block">{t("order.color")}</Label>
                <div className="flex gap-3 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`flex items-center gap-2 border px-3 py-2 text-sm transition ${
                        color === c.id ? "border-primary" : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <span className="h-4 w-4 border border-border" style={{ background: c.hex }} />
                      {t(`order.colors.${c.id}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="font-mono uppercase text-xs tracking-wider mb-3 block">{t("order.nozzle")}</Label>
                <RadioGroup value={quality} onValueChange={setQuality} className="grid grid-cols-2 gap-2">
                  <label className={`border p-4 cursor-pointer transition ${quality === "standard" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="standard" className="sr-only" />
                    <div className="font-semibold">{t("order.nozzle04")}</div>
                    <div className="text-xs text-muted-foreground">{t("order.nozzle04desc")}</div>
                  </label>
                  <label className={`border p-4 cursor-pointer transition ${quality === "detail" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="detail" className="sr-only" />
                    <div className="font-semibold">{t("order.nozzle02")}</div>
                    <div className="text-xs text-muted-foreground">{t("order.nozzle02desc")}</div>
                  </label>
                </RadioGroup>
              </div>
            </div>

            {/* Contact */}
            <div className="border-t border-border pt-8 space-y-4">
              <h2 className="font-mono uppercase text-xs tracking-wider text-muted-foreground">{t("order.contact")}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t("order.name")}</Label>
                  <Input id="name" name="name" required maxLength={200} autoComplete="name" />
                </div>
                <div>
                  <Label htmlFor="email">{t("order.email")}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    maxLength={320}
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t("order.phone")}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    maxLength={50}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>
                <div>
                  <Label htmlFor="address">{t("order.address")}</Label>
                  <Input id="address" name="address" maxLength={500} autoComplete="street-address" />
                </div>
              </div>
              <div>
                <Label htmlFor="note">{t("order.note")}</Label>
                <Textarea id="note" name="note" maxLength={1000} placeholder={t("order.notePlaceholder")} />
              </div>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox name="consent" required className="mt-0.5" />
                <span className="text-muted-foreground">
                  {t("order.consent")}
                </span>
              </label>
            </div>
          </div>

          {/* RIGHT: summary */}
          <aside className="md:col-span-2">
            <div className="md:sticky md:top-24 border border-border bg-card">
              <div className="p-6 border-b border-border">
                <div className="font-mono uppercase text-xs tracking-wider text-muted-foreground mb-1">{t("order.priceEstimate")}</div>
                {price ? (
                  <div className="text-4xl font-bold">{formatPriceEur(price, formatLocale)}</div>
                ) : (
                  <div className="text-2xl font-semibold text-muted-foreground">
                    {file && fmt && !fmt.parsable ? t("order.price24h") : "—"}
                  </div>
                )}
              </div>
              <div className="p-6 space-y-3 font-mono text-xs">
                <Row label={t("order.file")} value={file?.name ?? "—"} />
                <Row label={t("order.format")} value={fmt ? "." + fmt.ext : "—"} />
                <Row label={t("order.scale")} value={scale} />
                <Row label={t("order.colorRow")} value={t(`order.colors.${selectedColor.id}`)} />
                <Row label={t("order.nozzleRow")} value={quality === "detail" ? t("order.nozzle02") : t("order.nozzle04")} />
                {printVolumeCm3 != null && (
                  <Row label={t("order.modelVolume")} value={`${printVolumeCm3} cm³`} />
                )}
                {materialEstimate && (
                  <>
                    <Row label={t("order.material")} value={t("order.materialValue", { grams: materialEstimate.grams })} />
                    <Row label={t("order.filament")} value={t("order.filamentValue", { meters: materialEstimate.filamentMeters })} />
                    <p className="text-muted-foreground leading-relaxed pt-1">{t("order.materialEstimateHint")}</p>
                  </>
                )}
              </div>
              <div className="p-6 border-t border-border">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-mono uppercase tracking-wider"
                  disabled={submitting || !file || !hasViableScale}
                >
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("order.submitting")}</> : t("order.submit")}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-3">
                  {t("order.disclaimer")}
                </p>
              </div>
            </div>
          </aside>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-muted-foreground">{label}</div>
    <div className="text-foreground">{value}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right truncate max-w-[60%]">{value}</span>
  </div>
);

export default Order;
