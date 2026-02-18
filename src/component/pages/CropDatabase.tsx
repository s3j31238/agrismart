import DashboardLayout from "@/component/layout/DashboardLayout";
import { crops } from "@/component/data/crops";
import { useState } from "react";
import { Input } from "@/component/ui/input";
import { Search, Thermometer, Droplets, Calendar, Layers } from "lucide-react";

export default function CropDatabase() {
  const [search, setSearch] = useState("");
  const filtered = crops.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">Crop Database</h2>
            <p className="text-sm text-muted-foreground">{crops.length} crops available</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search crops..." className="pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(crop => (
            <div key={crop.id} className="card-agri hover:scale-[1.01] transition-transform">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{crop.icon}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{crop.name}</h3>
                  <p className="text-xs text-muted-foreground">{crop.season}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{crop.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Thermometer className="w-3.5 h-3.5 text-warning" />
                  {crop.tempMin}–{crop.tempMax}°C
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Droplets className="w-3.5 h-3.5 text-info" />
                  {crop.rainfallMin}–{crop.rainfallMax}mm
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  {crop.soil.join(", ")}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {crop.growthDays} days
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-medium text-primary">Yield: {crop.yieldEstimate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}


