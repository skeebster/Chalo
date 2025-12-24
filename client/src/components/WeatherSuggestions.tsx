import { useQuery } from "@tanstack/react-query";
import { Place } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, Sun, CloudRain, Snowflake, Wind, Thermometer, Umbrella, TreePine, Home as HomeIcon, Droplets } from "lucide-react";
import { isSaturday, isSunday, nextSaturday, format, isToday, addDays } from "date-fns";

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
        {/* iOS-Style 7-Day Week View Widget */}
        <div 
          className="relative rounded-3xl p-5 overflow-hidden"
          style={{ 
            background: '#2C2C2E',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif'
          }}
        >
          {/* Noise texture overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]" style={{ mixBlendMode: 'overlay' }}>
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)"/>
          </svg>

          {/* Header - Current Weather */}
          <div className="relative z-10 flex items-start justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8E8E93' }}>
                Somerset, NJ
              </p>
              <div className="flex items-baseline gap-1">
                <span 
                  className="font-extralight leading-none"
                  style={{ 
                    fontSize: '72px', 
                    color: '#FFFFFF',
                    letterSpacing: '-0.05em',
                    fontWeight: 200
                  }}
                >
                  {displayTemp}°
                </span>
              </div>
              <p className="text-lg font-semibold text-white mt-1">{weatherDesc}</p>
              <p className="text-sm" style={{ color: '#8E8E93' }}>
                H:{Math.round(dayWeather.high)}° L:{Math.round(dayWeather.low)}°
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <WeatherIcon className="w-10 h-10 text-white opacity-80" />
              {goodForOutdoor ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(52, 199, 89, 0.2)' }}>
                  <TreePine className="w-3 h-3" style={{ color: '#34C759' }} />
                  <span className="text-[10px] font-semibold" style={{ color: '#34C759' }}>Outdoor</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(255, 149, 0, 0.2)' }}>
                  <HomeIcon className="w-3 h-3" style={{ color: '#FF9500' }} />
                  <span className="text-[10px] font-semibold" style={{ color: '#FF9500' }}>Indoor</span>
                </div>
              )}
            </div>
          </div>

          {/* Temperature Range Bar */}
          <div 
            className="relative z-10 rounded-xl p-3 mb-4"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: '#636366' }}>
              <span>{Math.round(Math.min(...weather.daily.temperature_2m_min))}°</span>
              <span>Temperature Range</span>
              <span>{Math.round(Math.max(...weather.daily.temperature_2m_max))}°</span>
            </div>
            <div className="relative h-1.5 rounded-full" style={{ background: '#3A3A3C' }}>
              <div 
                className="absolute h-full rounded-full"
                style={{ 
                  background: 'linear-gradient(to right, #636366, #8E8E93)',
                  left: `${((dayWeather.low - Math.min(...weather.daily.temperature_2m_min)) / (Math.max(...weather.daily.temperature_2m_max) - Math.min(...weather.daily.temperature_2m_min))) * 100}%`,
                  right: `${100 - ((dayWeather.high - Math.min(...weather.daily.temperature_2m_min)) / (Math.max(...weather.daily.temperature_2m_max) - Math.min(...weather.daily.temperature_2m_min))) * 100}%`
                }}
              />
              <div 
                className="absolute w-2 h-2 rounded-full bg-white border border-zinc-700 -translate-y-0.5"
                style={{
                  left: `${((displayTemp - Math.min(...weather.daily.temperature_2m_min)) / (Math.max(...weather.daily.temperature_2m_max) - Math.min(...weather.daily.temperature_2m_min))) * 100}%`,
                  transform: 'translateX(-50%) translateY(-25%)'
                }}
              />
            </div>
          </div>

          {/* 7-Day Forecast Grid */}
          <div className="relative z-10 grid grid-cols-7 gap-1">
            {weather.daily.time.slice(0, 7).map((dateStr, i) => {
              const date = new Date(dateStr + 'T00:00:00');
              const DayIcon = getWeatherIcon(weather.daily.weathercode[i]);
              const high = Math.round(weather.daily.temperature_2m_max[i]);
              const low = Math.round(weather.daily.temperature_2m_min[i]);
              const precipProb = weather.daily.precipitation_probability_max[i];
              const isRainy = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weather.daily.weathercode[i]);
              const isSnowy = [71, 73, 75, 77, 85, 86].includes(weather.daily.weathercode[i]);
              const isWindy = weather.daily.weathercode[i] >= 95;
              
              return (
                <div 
                  key={dateStr}
                  className="flex flex-col items-center py-2 px-1 rounded-xl transition-colors"
                  style={{ 
                    background: i === dayIndex ? 'rgba(255,255,255,0.08)' : 'transparent'
                  }}
                >
                  <span 
                    className="text-[10px] font-semibold mb-2"
                    style={{ color: i === 0 ? '#FFFFFF' : '#636366' }}
                  >
                    {i === 0 ? 'TODAY' : format(date, 'EEE').toUpperCase()}
                  </span>
                  
                  <div className="relative mb-2">
                    {isWindy ? (
                      <div 
                        className="flex items-center justify-center rounded-full px-1.5 py-0.5"
                        style={{ background: '#FF453A' }}
                      >
                        <Wind className="w-3.5 h-3.5 text-white" />
                      </div>
                    ) : (
                      <>
                        <DayIcon 
                          className="w-5 h-5" 
                          style={{ color: weather.daily.weathercode[i] === 0 || weather.daily.weathercode[i] === 1 ? '#FFD60A' : '#FFFFFF' }} 
                        />
                        {(isRainy || isSnowy) && (
                          <div className="flex gap-0.5 mt-0.5 justify-center">
                            {[0, 1, 2].map(j => (
                              <div 
                                key={j}
                                className="w-0.5 h-1.5 rounded-full"
                                style={{ background: '#32ADE6' }}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  <span className="text-sm font-medium text-white">{high}°</span>
                  <span className="text-sm" style={{ color: '#8E8E93' }}>{low}°</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Place Suggestions */}
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
