export interface WeatherData {
  city: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  rainfallProb: number;
  condition: string;
  icon: string;
  description: string;
  isReal: boolean;
  isDay?: boolean;
  sprayWindow?: SprayWindowAdvice;
}

export interface SprayWindowAdvice {
  status: "Good" | "Caution" | "Avoid";
  score: number;
  bestTime: string;
  reason: string;
}

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const OPEN_WEATHER_BASE = "https://api.openweathermap.org/data/2.5";
const OPEN_METEO_GEO_BASE = "https://geocoding-api.open-meteo.com/v1";
const OPEN_METEO_FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";

const ICONS = {
  sun: "\u2600\uFE0F",
  moon: "\u263E",
  partlyDay: "\u26C5",
  partlyNight: "\u263E\u2601\uFE0F",
  cloudy: "\u2601\uFE0F",
  fog: "\uD83C\uDF2B\uFE0F",
  drizzle: "\uD83C\uDF26\uFE0F",
  rain: "\uD83C\uDF27\uFE0F",
  snow: "\u2744\uFE0F",
  thunder: "\u26C8\uFE0F",
} as const;

function mapOpenWeatherIcon(iconCode: string, id: number): string {
  const isDay = iconCode.includes("d");
  if (id >= 200 && id < 300) return ICONS.thunder;
  if (id >= 300 && id < 400) return ICONS.drizzle;
  if (id >= 500 && id < 600) return ICONS.rain;
  if (id >= 600 && id < 700) return ICONS.snow;
  if (id >= 700 && id < 800) return ICONS.fog;
  if (id === 800) return isDay ? ICONS.sun : ICONS.moon;
  if (id === 801 || id === 802) return isDay ? ICONS.partlyDay : ICONS.partlyNight;
  return ICONS.cloudy;
}

function mapOpenMeteoCode(code: number, isDay: boolean): { condition: string; description: string; icon: string } {
  if (code === 0) return { condition: "Clear", description: isDay ? "clear sky" : "clear night", icon: isDay ? ICONS.sun : ICONS.moon };
  if ([1, 2].includes(code)) {
    return {
      condition: "Partly Cloudy",
      description: isDay ? "partly cloudy day" : "partly cloudy night",
      icon: isDay ? ICONS.partlyDay : ICONS.partlyNight,
    };
  }
  if (code === 3) return { condition: "Cloudy", description: "overcast", icon: ICONS.cloudy };
  if ([45, 48].includes(code)) return { condition: "Fog", description: "foggy", icon: ICONS.fog };
  if ([51, 53, 55, 56, 57].includes(code)) return { condition: "Drizzle", description: "drizzle", icon: ICONS.drizzle };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { condition: "Rain", description: "rain", icon: ICONS.rain };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: "Snow", description: "snow", icon: ICONS.snow };
  if ([95, 96, 99].includes(code)) return { condition: "Thunderstorm", description: "thunderstorm", icon: ICONS.thunder };
  return { condition: "Cloudy", description: "cloudy", icon: ICONS.cloudy };
}

function normalizeCityQuery(city: string): string {
  const c = city.trim();
  if (!c) return c;
  if (c.includes(",")) return c;
  return `${c}, India`;
}

function evaluateSprayScore(
  temp: number,
  humidity: number,
  windSpeed: number,
  rainProb: number
): { score: number; reason: string } {
  let score = 100;
  const reasons: string[] = [];

  if (windSpeed > 20) {
    score -= 55;
    reasons.push("wind too high");
  } else if (windSpeed > 15) {
    score -= 35;
    reasons.push("wind slightly high");
  }

  if (rainProb > 60) {
    score -= 60;
    reasons.push("rain likely");
  } else if (rainProb > 35) {
    score -= 30;
    reasons.push("moderate rain risk");
  }

  if (humidity > 85) {
    score -= 20;
    reasons.push("very high humidity");
  }

  if (temp > 34) {
    score -= 15;
    reasons.push("hot conditions");
  } else if (temp < 12) {
    score -= 10;
    reasons.push("cool conditions");
  }

  const clamped = Math.max(0, Math.min(100, score));
  if (!reasons.length) return { score: clamped, reason: "stable wind and low rain risk" };
  return { score: clamped, reason: reasons.join(", ") };
}

function buildSprayWindowAdvice(
  windows: Array<{ timeLabel: string; temp: number; humidity: number; windSpeed: number; rainProb: number }>
): SprayWindowAdvice | undefined {
  if (!windows.length) return undefined;

  let best: { timeLabel: string; score: number; reason: string } | null = null;

  for (const w of windows) {
    const evaluated = evaluateSprayScore(w.temp, w.humidity, w.windSpeed, w.rainProb);
    if (!best || evaluated.score > best.score) {
      best = { timeLabel: w.timeLabel, score: evaluated.score, reason: evaluated.reason };
    }
  }

  if (!best) return undefined;
  const status: SprayWindowAdvice["status"] =
    best.score >= 75 ? "Good" : best.score >= 50 ? "Caution" : "Avoid";
  return { status, score: best.score, bestTime: best.timeLabel, reason: best.reason };
}

async function fetchOpenWeatherByCity(city: string): Promise<WeatherData> {
  const res = await fetch(
    `${OPEN_WEATHER_BASE}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
  );
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const d = await res.json();

  let rainfallProb = 0;
  let sprayWindow: SprayWindowAdvice | undefined;
  try {
    const fRes = await fetch(
      `${OPEN_WEATHER_BASE}/forecast?q=${encodeURIComponent(city)}&cnt=5&units=metric&appid=${API_KEY}`
    );
    if (fRes.ok) {
      const fData = await fRes.json();
      rainfallProb = Math.round((fData.list?.[0]?.pop ?? 0) * 100);
      const windows = (fData.list ?? []).slice(0, 4).map((item: any) => ({
        timeLabel: new Date(item.dt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        temp: Number(item.main?.temp ?? 0),
        humidity: Number(item.main?.humidity ?? 0),
        windSpeed: Math.round(Number(item.wind?.speed ?? 0) * 3.6),
        rainProb: Math.round(Number(item.pop ?? 0) * 100),
      }));
      sprayWindow = buildSprayWindowAdvice(windows);
    }
  } catch {
    rainfallProb = d.rain?.["1h"] ? Math.min(95, d.rain["1h"] * 15) : 0;
  }

  const weatherId = d.weather?.[0]?.id ?? 803;
  const iconCode = d.weather?.[0]?.icon ?? "03d";
  const isDay = iconCode.includes("d");
  return {
    city: d.name,
    temp: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    humidity: d.main.humidity,
    windSpeed: Math.round(d.wind.speed * 3.6),
    rainfallProb,
    condition: d.weather[0].main,
    icon: mapOpenWeatherIcon(iconCode, weatherId),
    description: d.weather[0].description,
    isReal: true,
    isDay,
    sprayWindow,
  };
}

async function fetchOpenWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const res = await fetch(
    `${OPEN_WEATHER_BASE}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const d = await res.json();

  let rainfallProb = 0;
  let sprayWindow: SprayWindowAdvice | undefined;
  try {
    const fRes = await fetch(
      `${OPEN_WEATHER_BASE}/forecast?lat=${lat}&lon=${lon}&cnt=5&units=metric&appid=${API_KEY}`
    );
    if (fRes.ok) {
      const fData = await fRes.json();
      rainfallProb = Math.round((fData.list?.[0]?.pop ?? 0) * 100);
      const windows = (fData.list ?? []).slice(0, 4).map((item: any) => ({
        timeLabel: new Date(item.dt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        temp: Number(item.main?.temp ?? 0),
        humidity: Number(item.main?.humidity ?? 0),
        windSpeed: Math.round(Number(item.wind?.speed ?? 0) * 3.6),
        rainProb: Math.round(Number(item.pop ?? 0) * 100),
      }));
      sprayWindow = buildSprayWindowAdvice(windows);
    }
  } catch {
    rainfallProb = 0;
  }

  const weatherId = d.weather?.[0]?.id ?? 803;
  const iconCode = d.weather?.[0]?.icon ?? "03d";
  const isDay = iconCode.includes("d");
  return {
    city: d.name,
    temp: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    humidity: d.main.humidity,
    windSpeed: Math.round(d.wind.speed * 3.6),
    rainfallProb,
    condition: d.weather[0].main,
    icon: mapOpenWeatherIcon(iconCode, weatherId),
    description: d.weather[0].description,
    isReal: true,
    isDay,
    sprayWindow,
  };
}

async function geocodeCity(city: string): Promise<{ latitude: number; longitude: number; name: string }> {
  const query = normalizeCityQuery(city);
  const res = await fetch(
    `${OPEN_METEO_GEO_BASE}/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
  );
  if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);
  const d = await res.json();
  const results = d.results ?? [];
  if (!results.length) throw new Error("City not found");
  const inIndia = results.find((r: { country_code?: string }) => r.country_code === "IN");
  const first = inIndia || results[0];
  return { latitude: first.latitude, longitude: first.longitude, name: first.name };
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `${OPEN_METEO_GEO_BASE}/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`
    );
    if (!res.ok) return `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`;
    const d = await res.json();
    return d.results?.[0]?.name || `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`;
  } catch {
    return `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`;
  }
}

async function fetchOpenMeteoByCoords(lat: number, lon: number, cityName: string): Promise<WeatherData> {
  const res = await fetch(
    `${OPEN_METEO_FORECAST_BASE}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,is_day&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability&daily=precipitation_probability_max&timezone=auto&forecast_days=2`
  );
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const d = await res.json();

  const current = d.current;
  if (!current) throw new Error("No live weather data");
  const isDay = Number(current.is_day ?? 1) === 1;
  const code = Number(current.weather_code ?? 3);
  const mapped = mapOpenMeteoCode(code, isDay);
  const rainfallProb = Math.round(Number(d.daily?.precipitation_probability_max?.[0] ?? 0));
  const hourly = d.hourly;
  let sprayWindow: SprayWindowAdvice | undefined;
  if (hourly?.time?.length) {
    const currentTime: string = String(current.time ?? "");
    const startIndex = Math.max(0, hourly.time.indexOf(currentTime));
    const windows: Array<{ timeLabel: string; temp: number; humidity: number; windSpeed: number; rainProb: number }> = [];
    for (let i = startIndex; i < Math.min(startIndex + 12, hourly.time.length); i += 1) {
      windows.push({
        timeLabel: new Date(hourly.time[i]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        temp: Number(hourly.temperature_2m?.[i] ?? 0),
        humidity: Number(hourly.relative_humidity_2m?.[i] ?? 0),
        windSpeed: Math.round(Number(hourly.wind_speed_10m?.[i] ?? 0)),
        rainProb: Math.round(Number(hourly.precipitation_probability?.[i] ?? 0)),
      });
    }
    sprayWindow = buildSprayWindowAdvice(windows);
  }

  return {
    city: cityName,
    temp: Math.round(Number(current.temperature_2m ?? 0)),
    feelsLike: Math.round(Number(current.apparent_temperature ?? current.temperature_2m ?? 0)),
    humidity: Math.round(Number(current.relative_humidity_2m ?? 0)),
    windSpeed: Math.round(Number(current.wind_speed_10m ?? 0)),
    rainfallProb: Math.max(0, Math.min(100, rainfallProb)),
    condition: mapped.condition,
    icon: mapped.icon,
    description: mapped.description,
    isReal: true,
    isDay,
    sprayWindow,
  };
}

export async function fetchWeatherByCity(city: string): Promise<WeatherData> {
  if (API_KEY) {
    try {
      return await fetchOpenWeatherByCity(city);
    } catch {
      // Fall through to Open-Meteo.
    }
  }

  const geo = await geocodeCity(city);
  return fetchOpenMeteoByCoords(geo.latitude, geo.longitude, geo.name);
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  if (API_KEY) {
    try {
      return await fetchOpenWeatherByCoords(lat, lon);
    } catch {
      // Fall through to Open-Meteo.
    }
  }

  const city = await reverseGeocode(lat, lon);
  return fetchOpenMeteoByCoords(lat, lon, city);
}

export function getWeatherAdvisories(weather: WeatherData): string[] {
  const advisories: string[] = [];
  if (weather.rainfallProb > 60) advisories.push("High rainfall expected. Ensure proper drainage in fields.");
  if (weather.temp > 35) advisories.push("Heat stress warning. Increase irrigation frequency and consider shade nets.");
  if (weather.humidity > 75) advisories.push("High humidity. Watch for fungal diseases and apply preventive fungicide.");
  if (weather.windSpeed > 20) advisories.push("Strong winds expected. Secure young plants and delay spraying operations.");
  if (weather.temp < 10) advisories.push("Frost risk. Protect sensitive crops with mulch or covers.");
  if (advisories.length === 0) advisories.push("Weather conditions are favorable for farming activities.");
  return advisories;
}

export function getCropWeatherScore(
  cropTempMin: number, cropTempMax: number,
  cropRainfallMin: number, cropRainfallMax: number,
  weather: WeatherData
): { score: number; confidence: "High" | "Medium" | "Low" } {
  let score = 100;
  if (weather.temp < cropTempMin) score -= (cropTempMin - weather.temp) * 5;
  if (weather.temp > cropTempMax) score -= (weather.temp - cropTempMax) * 5;
  const estRainfall = weather.rainfallProb * 2;
  if (estRainfall < cropRainfallMin) score -= 15;
  if (estRainfall > cropRainfallMax) score -= 20;
  if (weather.humidity > 85) score -= 10;
  score = Math.max(0, Math.min(100, score));
  const confidence = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
  return { score, confidence };
}

export function getWeather(city: string): WeatherData {
  return {
    city,
    temp: 0,
    feelsLike: 0,
    humidity: 0,
    windSpeed: 0,
    rainfallProb: 0,
    condition: "Unknown",
    icon: ICONS.cloudy,
    description: "unavailable",
    isReal: false,
    isDay: true,
    sprayWindow: undefined,
  };
}
