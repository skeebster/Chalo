import { useQuery } from "@tanstack/react-query";
import { isSaturday, isSunday, nextSaturday, format } from "date-fns";

interface WeatherData {
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    precipitation_probability_max: number[];
  };
}

export interface WeekendWeather {
  temp: number;
  high: number;
  low: number;
  code: number;
  precipProb: number;
  description: string;
  isWeekend: boolean;
}

function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear";
  if (code === 1) return "Clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 56 && code <= 57) return "Freezing drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 66 && code <= 67) return "Freezing rain";
  if (code >= 71 && code <= 75) return "Snow";
  if (code === 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 85 && code <= 86) return "Snow";
  if (code === 95) return "Storm";
  if (code >= 96 && code <= 99) return "Storm";
  return "";
}

export function useWeather(latitude?: number | null, longitude?: number | null) {
  const today = new Date();
  const isWeekend = isSaturday(today) || isSunday(today);
  const targetDate = isWeekend ? today : nextSaturday(today);
  
  // Round coordinates to reduce unique queries (same area gets same weather)
  const lat = latitude ? Math.round(latitude * 10) / 10 : null;
  const lon = longitude ? Math.round(longitude * 10) / 10 : null;

  return useQuery<WeekendWeather | null>({
    queryKey: ['weather', lat, lon, format(targetDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!lat || !lon) return null;
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America/New_York&forecast_days=7`
      );
      if (!response.ok) return null;
      
      const data: WeatherData = await response.json();
      
      const targetDayIndex = data.daily.time.findIndex(d => {
        const date = new Date(d + 'T00:00:00');
        return format(date, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd');
      });

      const dayIndex = targetDayIndex >= 0 ? targetDayIndex : 0;
      const code = isWeekend ? data.current_weather.weathercode : data.daily.weathercode[dayIndex];
      const temp = isWeekend 
        ? Math.round(data.current_weather.temperature)
        : Math.round(data.daily.temperature_2m_max[dayIndex]);

      return {
        temp,
        high: Math.round(data.daily.temperature_2m_max[dayIndex]),
        low: Math.round(data.daily.temperature_2m_min[dayIndex]),
        code,
        precipProb: data.daily.precipitation_probability_max[dayIndex],
        description: getWeatherDescription(code),
        isWeekend,
      };
    },
    enabled: !!lat && !!lon,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}

export function getWeatherIcon(code: number): string {
  if (code === 0 || code === 1) return "☀️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌧️";
  if (code >= 85 && code <= 86) return "❄️";
  if (code >= 95 && code <= 99) return "⛈️";
  return "☁️";
}
