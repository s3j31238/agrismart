import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import DashboardLayout from "@/component/layout/DashboardLayout";
import { crops } from "@/component/data/crops";
import { cropProblems } from "@/component/data/problems";
import { getWeatherAdvisories, getCropWeatherScore } from "@/component/services/weather";
import { useWeather } from "@/component/hooks/use-weather";
import {
  Wheat, Bug, CalendarDays, CloudSun, Search, Droplets, Wind, Thermometer,
  RefreshCw, MapPin, AlertCircle, Wifi, Loader2, ShieldAlert
} from "lucide-react";
import { Input } from "@/component/ui/input";
import { Button } from "@/component/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/component/ui/select";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const { weather, loading, error, inputCity, setInputCity, search, detectLocation } = useWeather("Pune");
  const [riskCropId, setRiskCropId] = useState("wheat");

  const quickLinks = [
    { label: t.dashboard.cropAdvisor, icon: Wheat, to: "/recommend" },
    { label: t.dashboard.problemSolver, icon: Bug, to: "/problems" },
    { label: t.dashboard.dailyPlanner, icon: CalendarDays, to: "/planner" },
    { label: t.dashboard.cropDatabase, icon: Search, to: "/crops" },
  ];

  const advisories = weather ? getWeatherAdvisories(weather) : [];
  const weatherScore = weather ? getCropWeatherScore(10, 25, 25, 75, weather).score : 0;
  const diseaseRisk = (() => {
    if (!weather) return null;
    const diseaseList = cropProblems.filter((p) => p.cropId === riskCropId && p.type === "Disease");
    const selectedCrop = crops.find((c) => c.id === riskCropId);

    let score = 20;
    if (weather.humidity >= 75) score += 30;
    if (weather.rainfallProb >= 40) score += 20;
    if (weather.temp >= 18 && weather.temp <= 32) score += 15;
    if (weather.windSpeed <= 12) score += 10;
    if (/(rain|drizzle|cloud|fog)/i.test(weather.condition)) score += 10;
    score = Math.max(0, Math.min(100, score));

    const level = score >= 70 ? "High" : score >= 45 ? "Medium" : "Low";
    const likely =
      diseaseList.length > 0
        ? diseaseList.slice(0, 2).map((d) => d.name)
        : weather.humidity >= 75 || weather.rainfallProb >= 40
        ? [
            `${selectedCrop?.name || "Crop"} fungal leaf spot risk`,
            `${selectedCrop?.name || "Crop"} root/stem rot risk`,
          ]
        : [
            `${selectedCrop?.name || "Crop"} mild foliar infection risk`,
            `${selectedCrop?.name || "Crop"} nutrient-stress mimic symptoms`,
          ];
    const actions =
      level === "High"
        ? [
            "Scout field within 24 hours, especially humid patches.",
            "Keep preventive fungicide ready and avoid late evening irrigation.",
          ]
        : level === "Medium"
        ? [
            "Monitor crop every 2 days for early spots/lesions.",
            "Improve airflow and avoid excess nitrogen.",
          ]
        : ["Continue weekly scouting and maintain field hygiene."];

    return { score, level, likely, actions };
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">

        {/* Weather Card */}
        <div className="card-agri overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">{t.weather.title}</h3>
              {weather?.isReal ? (
                <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  <Wifi className="w-3 h-3" /> Live
                </span>
              ) : null}
            </div>
            <p className="text-[10px] text-muted-foreground">{t.weather.autoRefresh}</p>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 mb-5">
            <Input
              value={inputCity}
              onChange={e => setInputCity(e.target.value)}
              placeholder={t.weather.searchPlaceholder}
              className="max-w-[220px] h-10"
              onKeyDown={e => e.key === "Enter" && search()}
            />
            <Button size="sm" onClick={search} disabled={loading} className="h-10 px-4">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.weather.search}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={detectLocation}
              disabled={loading}
              className="h-10 px-3 gap-1.5"
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">{t.weather.detectLocation}</span>
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 rounded-lg px-3 py-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {loading && !weather && (
            <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">{t.weather.loading}</span>
            </div>
          )}

          {weather && (
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-5xl">{weather.icon}</span>
                  <div>
                    <p className="text-4xl font-bold text-foreground">{weather.temp}°C</p>
                    <p className="text-sm text-muted-foreground mt-0.5 capitalize">
                      {weather.description} · {weather.city}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {weather.isDay ? "Day" : "Night"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.weather.feelsLike}: {weather.feelsLike}°C
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center gap-1.5 bg-accent/50 rounded-xl p-3">
                    <Droplets className="w-5 h-5 text-info" />
                    <span className="text-sm font-semibold text-foreground">{weather.humidity}%</span>
                    <span className="text-[10px] text-muted-foreground">{t.weather.humidity}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 bg-accent/50 rounded-xl p-3">
                    <Wind className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{weather.windSpeed} km/h</span>
                    <span className="text-[10px] text-muted-foreground">{t.weather.wind}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 bg-accent/50 rounded-xl p-3">
                    <CloudSun className="w-5 h-5 text-warning" />
                    <span className="text-sm font-semibold text-foreground">{weather.rainfallProb}%</span>
                    <span className="text-[10px] text-muted-foreground">{t.weather.rainChance}</span>
                  </div>
                </div>
              </div>

              <div className="sm:w-72 space-y-2">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                  {t.weather.advisories}
                </p>
                {advisories.map((a, i) => (
                  <p key={i} className="text-xs text-muted-foreground bg-accent rounded-xl px-3 py-2.5 leading-relaxed">{a}</p>
                ))}

                {weather.sprayWindow && (
                  <div className="mt-4 rounded-xl border border-border bg-card p-3">
                    <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Spray Window (Next 12h)</p>
                    <p className="mt-2 text-sm text-foreground">
                      Best time: <span className="font-semibold">{weather.sprayWindow.bestTime}</span>
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Status: {weather.sprayWindow.status} ({weather.sprayWindow.score}/100)
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Reason: {weather.sprayWindow.reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map(item => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="card-agri flex flex-col items-center gap-3 py-7 hover:scale-[1.03] active:scale-[0.98] transition-transform cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center group-hover:shadow-lg transition-shadow">
                <item.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground text-center">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-agri">
            <p className="text-sm text-muted-foreground">{t.dashboard.totalCrops}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{crops.length}</p>
            <p className="text-xs text-primary mt-1">{t.dashboard.inDatabase}</p>
          </div>
          <div className="card-agri">
            <p className="text-sm text-muted-foreground">{t.dashboard.activeSeason}</p>
            <p className="text-3xl font-bold text-foreground mt-1">Rabi</p>
            <p className="text-xs text-primary mt-1">{t.dashboard.winterCrops}</p>
          </div>
          <div className="card-agri">
            <p className="text-sm text-muted-foreground">{t.dashboard.weatherScore}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{weatherScore}%</p>
            <p className="text-xs text-primary mt-1">{t.dashboard.forWheat}</p>
          </div>
        </div>

        <div className="card-agri">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Disease Early Warning</h3>
            </div>
            <div className="w-56">
              <Select value={riskCropId} onValueChange={setRiskCropId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select crop" />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {diseaseRisk ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="rounded-xl bg-accent p-3">
                <p className="text-xs text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold text-foreground mt-1">{diseaseRisk.score}/100</p>
                <p className="text-xs mt-1 text-muted-foreground">Level: {diseaseRisk.level}</p>
              </div>
              <div className="rounded-xl bg-accent p-3">
                <p className="text-xs text-muted-foreground mb-1">Likely diseases</p>
                {diseaseRisk.likely.map((name) => (
                  <p key={name} className="text-sm text-foreground">• {name}</p>
                ))}
              </div>
              <div className="rounded-xl bg-accent p-3">
                <p className="text-xs text-muted-foreground mb-1">Immediate actions</p>
                {diseaseRisk.actions.map((a) => (
                  <p key={a} className="text-sm text-foreground">• {a}</p>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No disease profile available for selected crop.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


