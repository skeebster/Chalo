import { useQuery } from "@tanstack/react-query";
import { Place } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, Sun, CloudRain, Snowflake, Wind, Thermometer, Umbrella, TreePine, Home as HomeIcon } from "lucide-react";
import { isSaturday, isSunday, nextSaturday, format } from "date-fns";

interface WeatherData {
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    is_day: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    precipitation_probability_max: number[];
  };
}

interface WeatherSuggestionsProps {
  places: Place[];
  onPlaceClick: (place: Place) => void;
}

function getWeatherIcon(code: number) {
  if (code === 0 || code === 1) return Sun;
  if (code >= 2 && code <= 3) return Cloud;
  if (code >= 45 && code <= 48) return Cloud;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return Snowflake;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 85 && code <= 86) return Snowflake;
  if (code >= 95 && code <= 99) return CloudRain;
  return Cloud;
}

function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 56 && code <= 57) return "Freezing drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 66 && code <= 67) return "Freezing rain";
  if (code >= 71 && code <= 75) return "Snow";
  if (code === 77) return "Snow grains";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code === 95) return "Thunderstorm";
  if (code >= 96 && code <= 99) return "Thunderstorm with hail";
  return "Unknown";
}

function isGoodOutdoorWeather(code: number, temp: number, precipProb: number): boolean {
  const badWeatherCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];
  if (badWeatherCodes.includes(code)) return false;
  if (precipProb > 50) return false;
  if (temp < 35 || temp > 95) return false;
  return true;
}

function celsiusToFahrenheit(celsius: number): number {
  return Math.round(celsius * 9/5 + 32);
}

export function WeatherSuggestions({ places, onPlaceClick }: WeatherSuggestionsProps) {
  const today = new Date();
  const isWeekend = isSaturday(today) || isSunday(today);
  const targetDate = isWeekend ? today : nextSaturday(today);
  
  const { data: weather, isLoading, error } = useQuery<WeatherData>({
    queryKey: ['weather', format(targetDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=40.5018&longitude=-74.4518&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America/New_York&forecast_days=7`
      );
      if (!response.ok) throw new Error('Failed to fetch weather');
      return response.json();
    },
    staleTime: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return null;
  }

  const targetDayIndex = weather.daily.time.findIndex(d => {
    const date = new Date(d + 'T00:00:00');
    return format(date, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd');
  });

  const dayIndex = targetDayIndex >= 0 ? targetDayIndex : 0;
  const dayWeather = {
    date: weather.daily.time[dayIndex],
    high: weather.daily.temperature_2m_max[dayIndex],
    low: weather.daily.temperature_2m_min[dayIndex],
    code: weather.daily.weathercode[dayIndex],
    precipProb: weather.daily.precipitation_probability_max[dayIndex],
  };

  const currentWeather = weather.current_weather;
  const displayWeather = isWeekend ? currentWeather : dayWeather;
  const displayTemp = isWeekend ? Math.round(currentWeather.temperature) : dayWeather.high;
  const displayCode = isWeekend ? currentWeather.weathercode : dayWeather.code;
  
  const goodForOutdoor = isGoodOutdoorWeather(displayCode, displayTemp, dayWeather.precipProb);
  
  const WeatherIcon = getWeatherIcon(displayCode);
  const weatherDesc = getWeatherDescription(displayCode);

  const indoorPlaces = places.filter(p => p.indoorOutdoor === 'indoor' || p.indoorOutdoor === 'both');
  const outdoorPlaces = places.filter(p => p.indoorOutdoor === 'outdoor' || p.indoorOutdoor === 'both');
  
  const suggestedPlaces = goodForOutdoor 
    ? outdoorPlaces.slice(0, 3) 
    : indoorPlaces.slice(0, 3);

  const suggestionMessage = goodForOutdoor
    ? "Great weather for outdoor adventures!"
    : dayWeather.precipProb > 50 
      ? "Rain expected - perfect for indoor fun!"
      : displayTemp < 40 
        ? "Bundle up or stay cozy indoors!"
        : "Consider indoor activities today.";

  return (
    <Card className="border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-orange-500/10 overflow-visible">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" />
            Weather-Smart Picks
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {isWeekend ? "Today" : format(targetDate, "EEEE, MMM d")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center">
            <WeatherIcon className="w-8 h-8 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-bold text-white">{displayTemp}°F</span>
              {!isWeekend && (
                <span className="text-sm text-muted-foreground">
                  High: {Math.round(dayWeather.high)}° / Low: {Math.round(dayWeather.low)}°
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{weatherDesc}</p>
            {dayWeather.precipProb > 20 && (
              <div className="flex items-center gap-1 text-sm text-blue-400 mt-1">
                <Umbrella className="w-3 h-3" />
                <span>{dayWeather.precipProb}% chance of rain</span>
              </div>
            )}
          </div>
          <div className="text-right">
            {goodForOutdoor ? (
              <div className="flex items-center gap-1 text-green-400">
                <TreePine className="w-4 h-4" />
                <span className="text-sm font-medium">Outdoor</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-400">
                <HomeIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Indoor</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-3">{suggestionMessage}</p>
          {suggestedPlaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {suggestedPlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => onPlaceClick(place)}
                  className="text-left p-3 rounded-xl bg-background/30 hover-elevate transition-all"
                  data-testid={`weather-suggestion-${place.id}`}
                >
                  <p className="font-medium text-white text-sm truncate">{place.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{place.category}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No {goodForOutdoor ? "outdoor" : "indoor"} places found. Try adding more destinations!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
