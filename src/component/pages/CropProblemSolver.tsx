import { useEffect, useState } from "react";
import DashboardLayout from "@/component/layout/DashboardLayout";
import { crops } from "@/component/data/crops";
import { cropProblems, CropProblem } from "@/component/data/problems";
import { analyzeCropImageWithAI } from "@/component/services/vision";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/component/ui/select";
import { Textarea } from "@/component/ui/textarea";
import { Button } from "@/component/ui/button";
import { Bug, Clock, Download, CheckCircle2, AlertTriangle, XCircle, Camera, Loader2 } from "lucide-react";

const MIN_AI_CROP_CONFIDENCE = 0.7;

export default function CropProblemSolver() {
  const [cropId, setCropId] = useState("");
  const [problemType, setProblemType] = useState("All");
  const [description, setDescription] = useState("");
  const [results, setResults] = useState<CropProblem[]>([]);
  const [searched, setSearched] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoKeywords, setPhotoKeywords] = useState<string[]>([]);
  const [photoSummary, setPhotoSummary] = useState("");
  const [detectedCropId, setDetectedCropId] = useState("");
  const [detectedCropConfidence, setDetectedCropConfidence] = useState(0);
  const [detectedBy, setDetectedBy] = useState<"ai" | "local" | "">("");
  const [suggestedCropIds, setSuggestedCropIds] = useState<string[]>([]);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [diagnosisNotice, setDiagnosisNotice] = useState("");
  const [resultScores, setResultScores] = useState<Record<string, number>>({});
  const [autoDiagnoseTick, setAutoDiagnoseTick] = useState(0);

  const normalize = (v: string) => v.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");

  const resolveDetectedCropId = (name: string): string => {
    const target = normalize(name);
    if (!target || target === "unknown") return "";

    const aliasMap: Record<string, string> = {
      cotton: "cotton",
      rice: "rice",
      paddy: "rice",
      wheat: "wheat",
      maize: "maize",
      corn: "maize",
      soybean: "soybean",
      groundnut: "groundnut",
      peanut: "groundnut",
      sugarcane: "sugarcane",
      barley: "barley",
      mustard: "mustard",
      chickpea: "chickpea",
      gram: "chickpea",
      peas: "peas",
      oats: "oats",
      tomato: "tomato",
      potato: "potato",
      onion: "onion",
      sunflower: "sunflower",
      bajra: "bajra",
      jowar: "jowar",
      sorghum: "jowar",
    };

    if (aliasMap[target]) return aliasMap[target];

    const found = crops.find((c) => {
      const nameNorm = normalize(c.name);
      return nameNorm.includes(target) || target.includes(nameNorm);
    });

    return found?.id || "";
  };

  const getHSV = (r: number, g: number, b: number) => {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
      else if (max === gn) h = ((bn - rn) / d + 2) * 60;
      else h = ((rn - gn) / d + 4) * 60;
    }
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return { h, s, v };
  };

  const buildHeuristicKeywords = async (file: File): Promise<string[]> => {
    const tempUrl = URL.createObjectURL(file);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = tempUrl;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not available");

    const targetWidth = Math.min(320, image.width);
    const scale = targetWidth / image.width;
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let total = 0;
    let yellow = 0;
    let brown = 0;
    let paleWhite = 0;
    let dark = 0;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha < 128) continue;
      total += 1;

      const { h, s, v } = getHSV(data[i], data[i + 1], data[i + 2]);
      if (h >= 35 && h <= 70 && s > 0.25 && v > 0.25) yellow += 1;
      if (h >= 10 && h <= 38 && s > 0.3 && v < 0.7) brown += 1;
      if (s < 0.18 && v > 0.75) paleWhite += 1;
      if (v < 0.2) dark += 1;
    }

    URL.revokeObjectURL(tempUrl);
    if (!total) return [];

    const yellowRatio = yellow / total;
    const brownRatio = brown / total;
    const whiteRatio = paleWhite / total;
    const darkRatio = dark / total;
    const keywords: string[] = [];

    if (yellowRatio > 0.16) keywords.push("yellow", "nutrient", "deficiency", "wilting");
    if (brownRatio > 0.12 || darkRatio > 0.25) keywords.push("spot", "blight", "disease", "fungal");
    if (whiteRatio > 0.18) keywords.push("powdery", "mildew", "fungal");
    if (!keywords.length) keywords.push("leaf", "pest", "disease");

    return Array.from(new Set(keywords));
  };

  const rankCropsByKeywords = (words: string[]): Array<{ cropId: string; score: number }> => {
    if (!words.length) return [];
    const scores = new Map<string, number>();

    for (const p of cropProblems) {
      const text = `${p.name} ${p.explanation} ${p.treatment} ${p.preventiveMeasures}`.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (text.includes(w)) score += 1;
      }
      if (score > 0) {
        scores.set(p.cropId, (scores.get(p.cropId) || 0) + score);
      }
    }

    return Array.from(scores.entries())
      .map(([cropId, score]) => ({ cropId, score }))
      .sort((a, b) => b.score - a.score);
  };

  const analyzeImage = async (file: File) => {
    setAnalyzingPhoto(true);
    setDiagnosisNotice("");

    try {
      try {
        const ai = await analyzeCropImageWithAI(file);
        const mappedCropId = resolveDetectedCropId(ai.detectedCrop);

        setPhotoKeywords(Array.from(new Set(ai.keywords)));
        setPhotoSummary(ai.summary || "AI analysis completed.");
        setDetectedCropId(mappedCropId);
        setDetectedCropConfidence(ai.cropConfidence || 0);
        setDetectedBy("ai");
        setSuggestedCropIds(mappedCropId ? [mappedCropId] : []);

        if (mappedCropId && (ai.cropConfidence || 0) >= MIN_AI_CROP_CONFIDENCE) {
          setCropId(mappedCropId);
          setDiagnosisNotice("Crop detected from photo. Diagnosis is locked to this crop.");
          setAutoDiagnoseTick((v) => v + 1);
        } else if (mappedCropId) {
          setDiagnosisNotice("Detected crop confidence is low. Retake close-up photo or select crop manually.");
        } else {
          setDiagnosisNotice("Could not confidently detect crop from photo. Please select crop manually.");
        }
        return;
      } catch {
        // AI unavailable or key missing, use local fallback.
      }

      const keywords = await buildHeuristicKeywords(file);
      const ranked = rankCropsByKeywords(keywords);
      const topLocal = ranked.slice(0, 3).map((r) => r.cropId);
      const bestLocal = ranked[0];

      setPhotoKeywords(keywords);
      setPhotoSummary("AI unavailable, local image analysis used.");
      setSuggestedCropIds(topLocal);
      setDetectedBy("local");

      if (bestLocal && bestLocal.score >= 2) {
        const localConfidence = Math.max(0.45, Math.min(0.78, bestLocal.score / 10));
        setDetectedCropId(bestLocal.cropId);
        setDetectedCropConfidence(localConfidence);
        setCropId(bestLocal.cropId);
        setDiagnosisNotice("Local fallback inferred crop from symptoms. Verify suggested crop below.");
      } else {
        setDetectedCropId("");
        setDetectedCropConfidence(0);
        setDiagnosisNotice("Local analysis could not confidently infer crop. Select crop manually.");
      }
      setAutoDiagnoseTick((v) => v + 1);
    } catch {
      setPhotoKeywords([]);
      setPhotoSummary("Could not analyze image. Please try another photo.");
      setDetectedCropId("");
      setDetectedCropConfidence(0);
      setDetectedBy("");
      setSuggestedCropIds([]);
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const handleSearch = () => {
    setSearched(true);
    setDiagnosisNotice("");
    setResultScores({});

    const desc = description.trim().toLowerCase();
    const descWords = desc.split(/\s+/).filter(Boolean);
    const allWords = Array.from(new Set([...descWords, ...photoKeywords]));
    const effectiveCropId = cropId || detectedCropId;

    if (photoFile && !effectiveCropId) {
      setResults([]);
      setDiagnosisNotice("Crop not detected from photo. Select crop manually or upload clearer crop close-up image.");
      return;
    }

    if (photoFile && !cropId && detectedCropId && detectedBy === "ai" && detectedCropConfidence < MIN_AI_CROP_CONFIDENCE) {
      setResults([]);
      setDiagnosisNotice("Low crop confidence. Retake photo (single plant close-up) or manually select crop.");
      return;
    }

    let filtered = cropProblems;

    if (effectiveCropId) {
      filtered = filtered.filter((p) => p.cropId === effectiveCropId);
    }

    if (problemType && problemType !== "All") {
      filtered = filtered.filter((p) => p.type === problemType);
    }

    const scoreProblem = (p: CropProblem): number => {
      let score = effectiveCropId ? 25 : 10;
      if (problemType !== "All" && p.type === problemType) score += 10;
      if (!allWords.length) return Math.min(95, score + 25);

      const name = p.name.toLowerCase();
      const explanation = p.explanation.toLowerCase();
      const treatment = p.treatment.toLowerCase();
      const prevention = p.preventiveMeasures.toLowerCase();

      for (const w of allWords) {
        if (name.includes(w)) score += 22;
        else if (explanation.includes(w)) score += 14;
        else if (treatment.includes(w) || prevention.includes(w)) score += 8;
      }
      return Math.max(5, Math.min(99, score));
    };

    const scored = filtered
      .map((p) => ({ problem: p, score: scoreProblem(p) }))
      .sort((a, b) => b.score - a.score);

    const topRanked = scored.slice(0, 3);
    const topIds = new Set(topRanked.map((x) => x.problem.id));

    if (!topRanked.length && effectiveCropId && problemType !== "All") {
      filtered = cropProblems.filter((p) => p.cropId === effectiveCropId && p.type === problemType);
    } else if (!topRanked.length && effectiveCropId) {
      filtered = cropProblems.filter((p) => p.cropId === effectiveCropId);
    } else if (!topRanked.length && !effectiveCropId && problemType !== "All") {
      filtered = cropProblems.filter((p) => p.type === problemType);
    } else if (!topRanked.length && !effectiveCropId && !photoFile) {
      filtered = cropProblems.slice(0, 3);
    } else {
      filtered = topRanked.map((x) => x.problem);
    }

    if (!filtered.length) {
      setDiagnosisNotice("No exact disease match found for this crop and symptoms. Retake clearer close-up photo or add more symptom text.");
    } else {
      const scoreMap: Record<string, number> = {};
      for (const p of filtered) {
        if (topIds.has(p.id)) {
          const found = topRanked.find((x) => x.problem.id === p.id);
          scoreMap[p.id] = found ? found.score : 50;
        } else {
          scoreMap[p.id] = 50;
        }
      }
      setResultScores(scoreMap);
    }

    setResults(filtered);
  };

  useEffect(() => {
    if (autoDiagnoseTick <= 0) return;
    handleSearch();
    // We intentionally trigger diagnosis only when photo analysis raises a new tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDiagnoseTick]);

  const handleDownload = (problem: CropProblem) => {
    const crop = crops.find((c) => c.id === problem.cropId);
    const text = `AgriSmart - Crop Problem Report\n${"=".repeat(40)}\nCrop: ${crop?.name || problem.cropId}\nProblem: ${problem.name}\nType: ${problem.type}\nConfidence: ${problem.confidence}\n\nExplanation:\n${problem.explanation}\n\nTreatment:\n${problem.treatment}\n\nPreventive Measures:\n${problem.preventiveMeasures}\n\nRecovery Time: ${problem.recoveryTime}\n\nGenerated by AgriSmart Platform`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${problem.name.replace(/\s+/g, "_")}_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ConfidenceBadge = ({ c }: { c: string }) => {
    const colors = c === "High" ? "text-success bg-success/10" : c === "Medium" ? "text-warning bg-warning/10" : "text-destructive bg-destructive/10";
    const Icon = c === "High" ? CheckCircle2 : c === "Medium" ? AlertTriangle : XCircle;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colors}`}>
        <Icon className="w-3 h-3" /> {c}
      </span>
    );
  };

  const detectedCrop = crops.find((c) => c.id === (cropId || detectedCropId));

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        <div>
          <h2 className="text-xl font-bold text-foreground">Crop Problem Solver</h2>
          <p className="text-sm text-muted-foreground">Diagnose and solve crop issues instantly</p>
        </div>

        <div className="card-agri">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Select Crop</label>
              <Select value={cropId} onValueChange={setCropId}>
                <SelectTrigger><SelectValue placeholder="Choose crop" /></SelectTrigger>
                <SelectContent>{crops.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Problem Type</label>
              <Select value={problemType} onValueChange={setProblemType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {["All", "Pest", "Disease", "Nutrient Deficiency", "Water Issue"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full gap-2"><Bug className="w-4 h-4" /> Diagnose</Button>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-foreground mb-1.5 block">Additional Description (optional)</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what you observe..." rows={2} />
          </div>

          <div className="mt-4 space-y-3">
            <label className="text-sm font-medium text-foreground block">Upload Crop Photo (Camera/Gallery)</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background cursor-pointer hover:bg-accent transition-colors text-sm font-medium">
                <Camera className="w-4 h-4" />
                Choose Photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (photoPreview) URL.revokeObjectURL(photoPreview);
                    setPhotoFile(file);
                    setPhotoPreview(URL.createObjectURL(file));
                    setPhotoKeywords([]);
                    setPhotoSummary("");
                    setDetectedCropId("");
                    setDetectedCropConfidence(0);
                    setDetectedBy("");
                    setSuggestedCropIds([]);
                    setDiagnosisNotice("");
                  }}
                />
              </label>

              <Button
                type="button"
                variant="outline"
                disabled={!photoFile || analyzingPhoto}
                onClick={() => photoFile && analyzeImage(photoFile)}
                className="gap-2"
              >
                {analyzingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />}
                Analyze and Diagnose
              </Button>
            </div>

            {photoPreview && (
              <div className="rounded-lg border border-border p-3 bg-accent/30">
                <img src={photoPreview} alt="Uploaded crop preview" className="max-h-52 rounded-md object-cover" />
              </div>
            )}

            {(photoKeywords.length > 0 || diagnosisNotice) && (
              <div className="rounded-lg border border-border p-3 bg-accent/50">
                <p className="text-xs font-semibold text-foreground mb-2">Photo Insights</p>
                {photoKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {photoKeywords.map((k) => (
                      <span key={k} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {k}
                      </span>
                    ))}
                  </div>
                ) : null}

                {detectedCrop ? (
                  <p className="text-xs text-foreground">
                    Detected crop: <span className="font-semibold">{detectedCrop.name}</span>
                    {detectedCropConfidence > 0 ? ` (${Math.round(detectedCropConfidence * 100)}% confidence)` : ""}
                    {detectedBy ? ` via ${detectedBy.toUpperCase()}` : ""}
                  </p>
                ) : null}

                {suggestedCropIds.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-[11px] text-muted-foreground mb-1">Suggested crops (free mode):</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedCropIds.map((id) => {
                        const c = crops.find((x) => x.id === id);
                        if (!c) return null;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setCropId(id)}
                            className={`text-xs px-2 py-1 rounded-full border ${
                              cropId === id ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"
                            }`}
                          >
                            {c.icon} {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {photoSummary ? <p className="text-[11px] text-muted-foreground mt-1">{photoSummary}</p> : null}
                {diagnosisNotice ? <p className="text-[11px] text-muted-foreground mt-1">{diagnosisNotice}</p> : null}
                {photoFile && (!detectedCropId || detectedCropConfidence < MIN_AI_CROP_CONFIDENCE) ? (
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    <p>Retake guide:</p>
                    <p>- Take close-up of one affected leaf/plant.</p>
                    <p>- Keep good daylight, avoid shadows/blur.</p>
                    <p>- Fill at least 70% frame with crop area.</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Top {results.length} Ranked Diagnosis</h3>
            {results.map((p) => {
              const crop = crops.find((c) => c.id === p.cropId);
              return (
                <div key={p.id} className="card-agri space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{p.name}</h4>
                        <ConfidenceBadge c={p.confidence} />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                          Match {resultScores[p.id] ?? 50}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{crop?.icon} {crop?.name} - {p.type}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(p)} className="gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Report
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-accent">
                      <p className="text-xs font-semibold text-accent-foreground mb-1">Explanation</p>
                      <p className="text-sm text-muted-foreground">{p.explanation}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent">
                      <p className="text-xs font-semibold text-accent-foreground mb-1">Treatment</p>
                      <p className="text-sm text-muted-foreground">{p.treatment}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent">
                      <p className="text-xs font-semibold text-accent-foreground mb-1">Prevention</p>
                      <p className="text-sm text-muted-foreground">{p.preventiveMeasures}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-accent-foreground">Recovery Time</p>
                        <p className="text-sm text-muted-foreground">{p.recoveryTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {results.length === 0 && searched && (
          <div className="card-agri text-center py-8">
            <p className="text-muted-foreground">No problems found for this crop and symptom combination. Try another photo or add symptom details.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


