import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ModelViewer } from "@/components/ModelViewer";
import { toast } from "sonner";
import { ACCEPTED_EXTS, MAX_FILE_BYTES, getFormatInfo } from "@/lib/format-info";
import { parseModel, estimatePrice, type ModelStats } from "@/lib/parse-model";
import { UploadCloud, FileCheck, Loader2, X } from "lucide-react";

const COLORS = [
  { id: "white", label: "Bílá", hex: "#f3f1ec" },
  { id: "black", label: "Černá", hex: "#111111" },
  { id: "red", label: "Červená", hex: "#d13b2f" },
  { id: "stone", label: "Kámen", hex: "#a8a29e" },
  { id: "wood", label: "Dřevo", hex: "#8b6f4d" },
  { id: "anthracite", label: "Antracit", hex: "#2d2d2d" },
  { id: "terracotta", label: "Terracotta", hex: "#c4654a" },
];

const orderSchema = z.object({
  name: z.string().trim().min(2, "Zadejte jméno").max(200),
  email: z.string().trim().email("Neplatný email").max(320),
  phone: z.string().trim().max(50).optional(),
  address: z.string().trim().max(500).optional(),
  note: z.string().trim().max(1000).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Souhlas je nutný" }) }),
});

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
  const navigate = useNavigate();
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
  const price = stats ? estimatePrice(stats.volumeCm3, scale, quality) : null;

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

  const handleFile = useCallback((f: File) => {
    const info = getFormatInfo(f.name);
    if (!info) {
      toast.error("Nepodporovaný formát", { description: `Přijímáme: ${ACCEPTED_EXTS.map((e) => "." + e).join(", ")}` });
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      toast.error("Soubor je větší než 100 MB");
      return;
    }
    setFile(f);
    setStats(null);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !fmt) {
      toast.error("Nahrajte nejprve model");
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
      toast.error(parsed.error.errors[0]?.message ?? "Zkontrolujte formulář");
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
            bboxMm: stats?.bboxMm,
            volumeCm3: stats?.volumeCm3,
            estimatedPriceCzk: price ?? undefined,
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

      navigate("/dekujeme", {
        state: { email: parsed.data.email, price, hasEstimate: !!price, orderId },
      });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Zkuste to prosím znovu.";
      toast.error("Odeslání selhalo", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container py-12 md:py-16 flex-1">
        <div className="tag mb-4">Nová zakázka</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-2">Nahrát model</h1>
        <p className="text-muted-foreground mb-12 max-w-2xl">
          1) Nahrajte 3D soubor · 2) Vyberte parametry · 3) Pošlete poptávku.
          Cenu vidíte hned u podporovaných formátů.
        </p>

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
                <div className="font-semibold mb-1">Přetáhněte soubor sem</div>
                <div className="text-sm text-muted-foreground mb-4">nebo klikněte pro výběr · max 100 MB</div>
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
                    aria-label="Odebrat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4 space-y-4 font-mono text-xs">
                  <ModelViewer file={file} modelColor={selectedColor.hex} />
                  {parsing && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Analyzuji geometrii…
                    </div>
                  )}
                  {!parsing && stats && (
                    <div className="grid grid-cols-4 gap-4">
                      <Stat label="X" value={`${stats.bboxMm.x} mm`} />
                      <Stat label="Y" value={`${stats.bboxMm.y} mm`} />
                      <Stat label="Z" value={`${stats.bboxMm.z} mm`} />
                      <Stat label="Objem" value={`${stats.volumeCm3} cm³`} />
                    </div>
                  )}
                  {!parsing && !stats && fmt && !fmt.parsable && (
                    <div className="text-muted-foreground">
                      Formát <span className="text-foreground">.{fmt.ext}</span> převedeme ručně —
                      orientační cenu pošleme do 24 h po kontrole modelu.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Parameters */}
            <div className="space-y-6">
              <div>
                <Label className="font-mono uppercase text-xs tracking-wider mb-3 block">Měřítko</Label>
                <RadioGroup value={scale} onValueChange={setScale} className="grid grid-cols-3 gap-2">
                  {["1:100", "1:200", "1:500"].map((s) => (
                    <label
                      key={s}
                      className={`border p-3 text-center cursor-pointer font-mono text-sm transition ${
                        scale === s ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <RadioGroupItem value={s} className="sr-only" />
                      {s}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="font-mono uppercase text-xs tracking-wider mb-3 block">Barva filamentu</Label>
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
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="font-mono uppercase text-xs tracking-wider mb-3 block">Tryska</Label>
                <RadioGroup value={quality} onValueChange={setQuality} className="grid grid-cols-2 gap-2">
                  <label className={`border p-4 cursor-pointer transition ${quality === "standard" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="standard" className="sr-only" />
                    <div className="font-semibold">0,4 mm</div>
                    <div className="text-xs text-muted-foreground">rychlejší tisk · hrubší detail</div>
                  </label>
                  <label className={`border p-4 cursor-pointer transition ${quality === "detail" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="detail" className="sr-only" />
                    <div className="font-semibold">0,2 mm</div>
                    <div className="text-xs text-muted-foreground">jemnější detail · delší tisk</div>
                  </label>
                </RadioGroup>
              </div>
            </div>

            {/* Contact */}
            <div className="border-t border-border pt-8 space-y-4">
              <h2 className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Kontakt</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Jméno *</Label>
                  <Input id="name" name="name" required maxLength={200} autoComplete="name" />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
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
                  <Label htmlFor="phone">Telefon</Label>
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
                  <Label htmlFor="address">Doručovací adresa</Label>
                  <Input id="address" name="address" maxLength={500} autoComplete="street-address" />
                </div>
              </div>
              <div>
                <Label htmlFor="note">Poznámka</Label>
                <Textarea id="note" name="note" maxLength={1000} placeholder="Speciální požadavky, termín, popis modelu…" />
              </div>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox name="consent" required className="mt-0.5" />
                <span className="text-muted-foreground">
                  Souhlasím se zpracováním údajů pro účely této poptávky.
                </span>
              </label>
            </div>
          </div>

          {/* RIGHT: summary */}
          <aside className="md:col-span-2">
            <div className="md:sticky md:top-24 border border-border bg-card">
              <div className="p-6 border-b border-border">
                <div className="font-mono uppercase text-xs tracking-wider text-muted-foreground mb-1">Odhad ceny</div>
                {price ? (
                  <div className="text-4xl font-bold">
                    {price.toLocaleString("cs-CZ")} <span className="text-base text-muted-foreground">Kč</span>
                  </div>
                ) : (
                  <div className="text-2xl font-semibold text-muted-foreground">
                    {file && fmt && !fmt.parsable ? "Cena do 24 h" : "—"}
                  </div>
                )}
              </div>
              <div className="p-6 space-y-3 font-mono text-xs">
                <Row label="Soubor" value={file?.name ?? "—"} />
                <Row label="Formát" value={fmt ? "." + fmt.ext : "—"} />
                <Row label="Měřítko" value={scale} />
                <Row label="Barva" value={selectedColor.label} />
                <Row label="Tryska" value={quality === "detail" ? "0,2 mm" : "0,4 mm"} />
                {stats && <Row label="Objem modelu" value={`${stats.volumeCm3} cm³`} />}
              </div>
              <div className="p-6 border-t border-border">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-mono uppercase tracking-wider"
                  disabled={submitting || !file}
                >
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Odesílám…</> : "Odeslat poptávku →"}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-3">
                  Není to závazná objednávka. Po kontrole modelu vám pošleme finální cenu.
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
