import { useState, useMemo } from "react";
import DashboardLayout from "@/component/layout/DashboardLayout";
import { crops } from "@/component/data/crops";
import { getWeather, getWeatherAdvisories } from "@/component/services/weather";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/component/ui/select";
import { Input } from "@/component/ui/input";
import { Button } from "@/component/ui/button";
import { Progress } from "@/component/ui/progress";
import { CalendarDays, Droplets, Beaker, Bug, CloudSun, TrendingUp, IndianRupee, Printer } from "lucide-react";

export default function DailyPlanner() {
  const [cropId, setCropId] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [landSize, setLandSize] = useState("1");
  const [city, setCity] = useState("Delhi");
  const [active, setActive] = useState(false);

  const crop = crops.find((c) => c.id === cropId);
  const weather = getWeather(city);
  const advisories = getWeatherAdvisories(weather);

  const planData = useMemo(() => {
    if (!crop || !sowingDate) return null;
    const sowing = new Date(sowingDate);
    const today = new Date();
    const daysSinceSowing = Math.max(0, Math.floor((today.getTime() - sowing.getTime()) / 86400000));
    const progressPercent = Math.min(100, Math.round((daysSinceSowing / crop.growthDays) * 100));
    const daysToHarvest = Math.max(0, crop.growthDays - daysSinceSowing);

    const stagePercent = daysSinceSowing / crop.growthDays;
    let stage = "Germination";
    if (stagePercent > 0.8) stage = "Maturity";
    else if (stagePercent > 0.6) stage = "Reproductive";
    else if (stagePercent > 0.3) stage = "Vegetative Growth";
    else if (stagePercent > 0.1) stage = "Seedling";

    let irrigation = "Normal watering - 20mm per week";
    if (weather.temp > 35) irrigation = "Increase irrigation to 30mm - heat stress conditions";
    else if (weather.rainfallProb > 60) irrigation = "Reduce irrigation - rainfall expected";
    else if (stagePercent > 0.6) irrigation = "Critical watering phase - ensure consistent moisture";

    let fertilizer = "No fertilizer needed today";
    if (stagePercent < 0.15) fertilizer = "Apply basal dose of NPK (20:20:20)";
    else if (stagePercent > 0.25 && stagePercent < 0.35) fertilizer = "Top dressing with Urea @ 40 kg/ha";
    else if (stagePercent > 0.5 && stagePercent < 0.6) fertilizer = "Apply Potash for grain/fruit development";

    let diseaseRisk = "Low";
    if (weather.humidity > 75) diseaseRisk = "High - fungal conditions favorable";
    else if (weather.humidity > 60) diseaseRisk = "Moderate - monitor closely";

    const area = Number(landSize) || 1;
    const yieldRange = crop.yieldEstimate.match(/(\d+)-(\d+)/);
    const avgYield = yieldRange ? (Number(yieldRange[1]) + Number(yieldRange[2])) / 2 : 20;
    const totalYield = avgYield * area;
    const revenue = totalYield * crop.marketPrice;

    return { daysSinceSowing, progressPercent, daysToHarvest, stage, irrigation, fertilizer, diseaseRisk, totalYield, revenue, area };
  }, [crop, sowingDate, landSize, city, weather]);

  const monthlyPlan = useMemo(() => {
    if (!crop || !sowingDate) return [];

    const sowing = new Date(sowingDate);
    const today = new Date();
    const tasks: Array<{ date: string; day: number; stage: string; tasks: string[] }> = [];

    for (let i = 0; i < 30; i += 1) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const day = Math.max(0, Math.floor((targetDate.getTime() - sowing.getTime()) / 86400000));
      const stagePercent = day / crop.growthDays;

      let stage = "Germination";
      if (stagePercent > 0.8) stage = "Maturity";
      else if (stagePercent > 0.6) stage = "Reproductive";
      else if (stagePercent > 0.3) stage = "Vegetative Growth";
      else if (stagePercent > 0.1) stage = "Seedling";

      const dailyTasks: string[] = [];
      if (i % 3 === 0) dailyTasks.push("Irrigation check and moisture review");
      if (i % 7 === 0) dailyTasks.push("Pest and disease scouting in field");
      if (stagePercent < 0.15 && i < 10) dailyTasks.push("Basal nutrient monitoring and early growth support");
      if (stagePercent > 0.25 && stagePercent < 0.35 && i % 10 === 0) dailyTasks.push("Top dressing plan (urea split dose)");
      if (stagePercent > 0.5 && stagePercent < 0.65 && i % 10 === 0) dailyTasks.push("Potash support for reproductive growth");
      if (stagePercent > 0.85) dailyTasks.push("Harvest readiness check and labor planning");
      if (weather.rainfallProb > 60 && i < 5) dailyTasks.push("Reduce irrigation due to expected rainfall");
      if (weather.humidity > 75 && i % 5 === 0) dailyTasks.push("Preventive fungicide readiness and canopy aeration");
      if (!dailyTasks.length) dailyTasks.push("Regular field walk and crop health observation");

      tasks.push({
        date: targetDate.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }),
        day,
        stage,
        tasks: dailyTasks,
      });
    }

    return tasks;
  }, [crop, sowingDate, weather.humidity, weather.rainfallProb]);

  const handleActivate = () => {
    if (cropId && sowingDate) setActive(true);
  };

  const handlePrintMonthlyPlan = () => {
    if (!crop || !monthlyPlan.length) return;

    const html = `
      <html>
        <head>
          <title>Monthly Planner - ${crop.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { margin: 0 0 4px; font-size: 22px; }
            p.meta { margin: 0 0 16px; color: #444; font-size: 13px; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
            .row { display: flex; justify-content: space-between; gap: 8px; }
            .date { font-weight: 700; }
            .stage { color: #444; font-size: 12px; margin: 4px 0 6px; }
            ul { margin: 0; padding-left: 18px; font-size: 13px; }
            li { margin: 3px 0; }
          </style>
        </head>
        <body>
          <h1>AgriSmart Monthly Planner</h1>
          <p class="meta">Crop: ${crop.name} | City: ${city} | Generated: ${new Date().toLocaleString()}</p>
          ${monthlyPlan
            .map(
              (item) => `
                <div class="card">
                  <div class="row">
                    <span class="date">${item.date}</span>
                    <span>Day ${item.day}</span>
                  </div>
                  <div class="stage">Stage: ${item.stage}</div>
                  <ul>
                    ${item.tasks.map((t) => `<li>${t}</li>`).join("")}
                  </ul>
                </div>
              `
            )
            .join("")}
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        <div>
          <h2 className="text-xl font-bold text-foreground">Smart Crop Care Daily Planner</h2>
          <p className="text-sm text-muted-foreground">Personalized daily farming guidance and profit estimation</p>
        </div>

        <div className="card-agri">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Select Crop</label>
              <Select value={cropId} onValueChange={(v) => { setCropId(v); setActive(false); }}>
                <SelectTrigger><SelectValue placeholder="Choose crop" /></SelectTrigger>
                <SelectContent>{crops.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Sowing Date</label>
              <Input type="date" value={sowingDate} onChange={(e) => { setSowingDate(e.target.value); setActive(false); }} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Land Size (hectares)</label>
              <Input type="number" value={landSize} onChange={(e) => setLandSize(e.target.value)} min="0.1" step="0.1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">City</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="For weather" />
            </div>
          </div>
          <Button className="mt-4 gap-2" onClick={handleActivate} disabled={!cropId || !sowingDate}>
            <CalendarDays className="w-4 h-4" /> Generate Daily Plan
          </Button>
        </div>

        {active && planData && crop && (
          <div className="space-y-4">
            <div className="card-agri">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground">{crop.icon} {crop.name} - {planData.stage}</h3>
                  <p className="text-xs text-muted-foreground">Day {planData.daysSinceSowing} of {crop.growthDays}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{planData.daysToHarvest}</p>
                  <p className="text-xs text-muted-foreground">days to harvest</p>
                </div>
              </div>
              <Progress value={planData.progressPercent} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">{planData.progressPercent}% complete</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-agri">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-5 h-5 text-info" />
                  <h4 className="font-medium text-foreground">Irrigation</h4>
                </div>
                <p className="text-sm text-muted-foreground">{planData.irrigation}</p>
              </div>
              <div className="card-agri">
                <div className="flex items-center gap-2 mb-2">
                  <Beaker className="w-5 h-5 text-primary" />
                  <h4 className="font-medium text-foreground">Fertilizer</h4>
                </div>
                <p className="text-sm text-muted-foreground">{planData.fertilizer}</p>
              </div>
              <div className="card-agri">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="w-5 h-5 text-warning" />
                  <h4 className="font-medium text-foreground">Disease Risk</h4>
                </div>
                <p className="text-sm text-muted-foreground">{planData.diseaseRisk}</p>
              </div>
              <div className="card-agri">
                <div className="flex items-center gap-2 mb-2">
                  <CloudSun className="w-5 h-5 text-info" />
                  <h4 className="font-medium text-foreground">Weather Action</h4>
                </div>
                <p className="text-sm text-muted-foreground">{advisories[0]}</p>
              </div>
            </div>

            <div className="card-agri">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Profit Estimator</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-accent text-center">
                  <p className="text-xs text-muted-foreground mb-1">Estimated Yield</p>
                  <p className="text-xl font-bold text-foreground">{planData.totalYield.toFixed(0)} qtl</p>
                  <p className="text-xs text-muted-foreground">{planData.area} ha</p>
                </div>
                <div className="p-4 rounded-lg bg-accent text-center">
                  <p className="text-xs text-muted-foreground mb-1">Market Price</p>
                  <p className="text-xl font-bold text-foreground flex items-center justify-center gap-0.5">
                    <IndianRupee className="w-4 h-4" />{crop.marketPrice.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">per quintal</p>
                </div>
                <div className="p-4 rounded-lg gradient-primary text-center">
                  <p className="text-xs text-primary-foreground/80 mb-1">Est. Revenue</p>
                  <p className="text-xl font-bold text-primary-foreground flex items-center justify-center gap-0.5">
                    <IndianRupee className="w-4 h-4" />{planData.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-primary-foreground/80">total</p>
                </div>
              </div>
            </div>

            <div className="card-agri">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Monthly Planner (Next 30 Days)</h4>
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handlePrintMonthlyPlan}>
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </Button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
                {monthlyPlan.map((item) => (
                  <div key={`${item.date}-${item.day}`} className="rounded-lg bg-accent p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-foreground">{item.date}</p>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        Day {item.day}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Stage: {item.stage}</p>
                    <div className="space-y-1.5">
                      {item.tasks.map((t) => (
                        <p key={t} className="text-xs text-foreground">- {t}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
