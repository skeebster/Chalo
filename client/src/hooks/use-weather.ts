import { useQuery } from "@tanstack/react-query";
import { isSaturday, isSunday, nextSaturday, format, addDays } from "date-fns";

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

export interface DayForecast {
  date: Date;
  dayName: string;
  high: number;
  low: number;
  code: number;
  precipProb: number;
  description: string;
}

export interface WeekendWeather {
  temp: number;
  high: number;
  low: number;
  code: number;
  precipProb: number;
  description: string;
  isWeekend: boolean;
  weekForecast: DayForecast[];
  attire: string[];
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

function getAttireRecommendations(high: number, low: number, code: number, precipProb: number): string[] {
  const attire: string[] = [];
  
  // Temperature-based recommendations
  if (low < 32) {
    attire.push("Heavy winter coat");
    attire.push("Warm layers");
    attire.push("Gloves & hat");
  } else if (low < 45) {
    attire.push("Warm jacket");
    attire.push("Layered clothing");
  } else if (low < 55) {
    attire.push("Light jacket");
    attire.push("Long sleeves");
  } else if (high > 85) {
    attire.push("Light, breathable clothing");
    attire.push("Hat for sun protection");
  } else if (high > 70) {
    attire.push("Comfortable casual wear");
  }
  
  // Weather condition-based recommendations
  if (precipProb > 40 || (code >= 51 && code <= 82)) {
    attire.push("Rain jacket or umbrella");
    attire.push("Waterproof shoes");
  }
  
  if (code >= 71 && code <= 86) {
    attire.push("Snow boots");
    attire.push("Warm waterproof gear");
  }
  
  if (code === 0 || code === 1) {
    attire.push("Sunglasses");
    if (high > 75) {
      attire.push("Sunscreen");
    }
  }
  
  // Hiking/outdoor gear for moderate weather
  if (attire.length === 0 || (high >= 55 && high <= 75 && precipProb < 30)) {
    attire.push("Comfortable walking shoes");
  }
  
  return attire.slice(0, 4); // Limit to 4 recommendations
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
      
      // Build 7-day forecast
      const weekForecast: DayForecast[] = data.daily.time.map((dateStr, i) => {
        const date = new Date(dateStr + 'T00:00:00');
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return {
          date,
          dayName: i === 0 ? 'Today' : dayNames[date.getDay()],
          high: Math.round(data.daily.temperature_2m_max[i]),
          low: Math.round(data.daily.temperature_2m_min[i]),
          code: data.daily.weathercode[i],
          precipProb: data.daily.precipitation_probability_max[i],
          description: getWeatherDescription(data.daily.weathercode[i]),
        };
      });
      
      // Get attire recommendations for the target day
      const attire = getAttireRecommendations(
        data.daily.temperature_2m_max[dayIndex],
        data.daily.temperature_2m_min[dayIndex],
        code,
        data.daily.precipitation_probability_max[dayIndex]
      );

      return {
        temp,
        high: Math.round(data.daily.temperature_2m_max[dayIndex]),
        low: Math.round(data.daily.temperature_2m_min[dayIndex]),
        code,
        precipProb: data.daily.precipitation_probability_max[dayIndex],
        description: getWeatherDescription(code),
        isWeekend,
        weekForecast,
        attire,
      };
    },
    enabled: !!lat && !!lon,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}

export function getWeatherIcon(code: number): string {
  if (code === 0 || code === 1) return "sun";
  if (code === 2) return "cloud-sun";
  if (code === 3) return "cloud";
  if (code >= 45 && code <= 48) return "cloud";
  if (code >= 51 && code <= 67) return "cloud-rain";
  if (code >= 71 && code <= 77) return "snowflake";
  if (code >= 80 && code <= 82) return "cloud-rain";
  if (code >= 85 && code <= 86) return "snowflake";
  if (code >= 95 && code <= 99) return "cloud-lightning";
  return "cloud";
}
