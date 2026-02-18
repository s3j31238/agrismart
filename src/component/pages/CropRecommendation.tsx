import { useState } from "react";
import DashboardLayout from "@/component/layout/DashboardLayout";
import { useLang } from "@/contexts/LangContext";
import { crops, soilTypes, seasons } from "@/component/data/crops";
import { getWeather, getCropWeatherScore } from "@/component/services/weather";
import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/component/ui/select";
import { Sparkles, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

interface Recommendation {
  crop: typeof crops[0];
  score: number;
  confidence: "High" | "Medium" | "Low";
  reasons: string[];
}

function buildReasons(
  crop: typeof crops[0],
  soil: string,
  season: string,
  tMin: number,
  tMax: number,
  rMin: number,
  rMax: number,
  weatherScore: number
): string[] {
  const reasons: string[] = [];

  if (soil && crop.soil.includes(soil)) {
    reasons.push(`✅ Grows well in ${soil} soil — ideal match for your land.`);
  }
  if (season && (crop.season === season || crop.season.includes(season))) {
    reasons.push(`📅 Perfect for ${season} season — aligned with your planting window.`);
  }
  const tempOverlap = Math.min(crop.tempMax, tMax) - Math.max(crop.tempMin, tMin);
  if (tempOverlap > 0) {
    reasons.push(`🌡️ Temperature range ${crop.tempMin}–${crop.tempMax}°C overlaps well with your input (${tMin}–${tMax}°C).`);
  }
  const rainOverlap = Math.min(crop.rainfallMax, rMax) - Math.max(crop.rainfallMin, rMin);
  if (rainOverlap > 0) {
    reasons.push(`🌧️ Rainfall need ${crop.rainfallMin}–${crop.rainfallMax}mm matches your field conditions.`);
  }
  if (weatherScore >= 70) {
    reasons.push(`🌤️ Current weather is highly compatible (score: ${weatherScore}%).`);
  } else if (weatherScore >= 45) {
    reasons.push(`⛅ Current weather is moderately suitable (score: ${weatherScore}%).`);
  }
  reasons.push(`📦 Expected yield: ${crop.yieldEstimate}`);
  return reasons;
}

export default function CropRecommendation() {
  const { t } = useLang();
  const [soil, setSoil] = useState("");
  const [season, setSeason] = useState("");
  const [tempMin, setTempMin] = useState("15");
  const [tempMax, setTempMax] = useState("30");
  const [rainfallMin, setRainfallMin] = useState("40");
  const [rainfallMax, setRainfallMax] = useState("100");
  const [city, setCity] = useState("Pune");
  const [results, setResults] = useState<Recommendation[]>([]);
  const [validated, setValidated] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleRecommend = () => {
    setSearched(true);
    if (!soil && !season) {
      setValidated(true);
      setResults([]);
      return;
    }
    setValidated(false);

    const weather = getWeather(city);
    const tMin = Number(tempMin), tMax = Number(tempMax);
    const rMin = Number(rainfallMin), rMax = Number(rainfallMax);

    const filtered = crops.filter(c => {
      if (soil && !c.soil.includes(soil)) return false;
      if (season && c.season !== season && c.season !== "Kharif/Rabi") return false;
      return true;
    });

    const scored = filtered.map(crop => {
      let score = 0;
      const tempOverlap = Math.max(0, Math.min(crop.tempMax, tMax) - Math.max(crop.tempMin, tMin));
      const tempRange = Math.max(1, tMax - tMin);
      score += (tempOverlap / tempRange) * 40;
      const rainOverlap = Math.max(0, Math.min(crop.rainfallMax, rMax) - Math.max(crop.rainfallMin, rMin));
      const rainRange = Math.max(1, rMax - rMin);
      score += (rainOverlap / rainRange) * 30;
      if (soil && crop.soil.includes(soil)) score += 20;
      else if (!soil) score += 10;
      const ws = getCropWeatherScore(crop.tempMin, crop.tempMax, crop.rainfallMin, crop.rainfallMax, weather);
      score += ws.score * 0.1;
      score = Math.min(100, Math.round(score));
      const confidence = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
      const reasons = buildReasons(crop, soil, season, tMin, tMax, rMin, rMax, ws.score);
      return { crop, score, confidence, reasons } as Recommendation;
    });

    scored.sort((a, b) => b.score - a.score);
    setResults(scored.slice(0, 3));
  };

  const ConfidenceIcon = ({ c }: { c: string }) => {
    if (c === "High") return <CheckCircle2 className="w-4 h-4 text-success" />;
    if (c === "Medium") return <AlertTriangle className="w-4 h-4 text-warning" />;
    return <XCircle className="w-4 h-4 text-destructive" />;
  };

  const confidenceColor = (c: string) =>
    c === "High" ? "bg-success/10 text-success border-success/20" :
    c === "Medium" ? "bg-warning/10 text-warning border-warning/20" :
    "bg-destructive/10 text-destructive border-destructive/20";

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t.recommend.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t.recommend.subtitle}</p>
        </div>

        <div className="card-agri">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">{t.recommend.soilType}</label>
              <Select value={soil} onValueChange={setSoil}>
                <SelectTrigger className="h-11"><SelectValue placeholder={t.recommend.selectSoil} /></SelectTrigger>
                <SelectContent>{soilTypes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">{t.recommend.season}</label>
              <Select value={season} onValueChange={setSeason}>
                <SelectTrigger className="h-11"><SelectValue placeholder={t.recommend.selectSeason} /></SelectTrigger>
                <SelectContent>{seasons.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">{t.recommend.city}</label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Pune, Nagpur..." className="h-11" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">{t.recommend.tempRange}</label>
              <div className="flex gap-2">
                <Input value={tempMin} onChange={e => setTempMin(e.target.value)} placeholder={t.recommend.min} type="number" className="h-11" />
                <Input value={tempMax} onChange={e => setTempMax(e.target.value)} placeholder={t.recommend.max} type="number" className="h-11" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">{t.recommend.rainfallRange}</label>
              <div className="flex gap-2">
                <Input value={rainfallMin} onChange={e => setRainfallMin(e.target.value)} placeholder={t.recommend.min} type="number" className="h-11" />
                <Input value={rainfallMax} onChange={e => setRainfallMax(e.target.value)} placeholder={t.recommend.max} type="number" className="h-11" />
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={handleRecommend} className="w-full gap-2 h-11 text-base font-semibold">
                <Sparkles className="w-5 h-5" /> {t.recommend.getRecommendations}
              </Button>
            </div>
          </div>
        </div>

        {validated && (
          <div className="flex items-center gap-3 bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 text-sm text-warning">
            <Info className="w-5 h-5 shrink-0" />
            {t.recommend.validation}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-foreground text-lg">{t.recommend.topResults}</h3>
            {results.map((r, i) => (
              <div key={r.crop.id} className="card-agri border-l-4 border-l-primary">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-3xl shrink-0">
                      {r.crop.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-bold text-foreground text-lg">#{i + 1} {r.crop.name}</h4>
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${confidenceColor(r.confidence)}`}>
                          <ConfidenceIcon c={r.confidence} />
                          {t.confidence[r.confidence as keyof typeof t.confidence]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{r.crop.description}</p>

                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">{t.recommend.whyRecommended}:</p>
                        {r.reasons.map((reason, ri) => (
                          <p key={ri} className="text-xs text-muted-foreground bg-accent/50 rounded-lg px-3 py-1.5">{reason}</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-center sm:ml-4">
                    <div className="w-18 h-18 rounded-full border-4 border-primary bg-primary/5 flex items-center justify-center mx-auto" style={{ width: 72, height: 72 }}>
                      <span className="text-xl font-bold text-primary">{r.score}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">{t.recommend.matchScore}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


