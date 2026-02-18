import { useState, useEffect, useCallback, useRef } from "react";
import {
  WeatherData,
  fetchWeatherByCity,
  fetchWeatherByCoords,
} from "@/component/services/weather";

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export function useWeather(initialCity = "Pune") {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState(initialCity);
  const [inputCity, setInputCity] = useState(initialCity);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (target: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeatherByCity(target);
      setWeather(data);
      setCity(data.city);
      setInputCity(data.city);
    } catch {
      setError("Live weather unavailable. Check internet or try another city.");
    } finally {
      setLoading(false);
    }
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
          setWeather(data);
          setCity(data.city);
          setInputCity(data.city);
          setError(null);
        } catch {
          setError("Live weather unavailable for current location.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setError("Location access denied. Please enter city manually.");
      }
    );
  }, [city]);

  const search = useCallback(() => {
    if (inputCity.trim()) {
      load(inputCity.trim());
      setCity(inputCity.trim());
    }
  }, [inputCity, load]);

  // Initial load + auto-refresh
  useEffect(() => {
    load(city);
  }, [city, load]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => load(city), REFRESH_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [city, load]);

  return { weather, loading, error, inputCity, setInputCity, search, detectLocation, city };
}


