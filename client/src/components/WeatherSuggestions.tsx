import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Place } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Cloud, Sun, CloudRain, Snowflake, Wind, Thermometer, Umbrella, TreePine, Home as HomeIcon, Droplets, ExternalLink } from "lucide-react";
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
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
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
      <CardContent className="space-y-3 pt-3">
        {/* Compact iOS-Style Week View */}
        <div className="relative rounded-xl p-3 bg-card/80 border border-border/50 overflow-hidden">
          {/* Noise texture overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" style={{ mixBlendMode: 'overlay' }}>
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)"/>
          </svg>

          {/* Header Row */}
          <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <WeatherIcon className="w-7 h-7 text-primary" />
                <span className="text-3xl font-light text-foreground tracking-tight">{displayTemp}°</span>
              </div>
              <div className="text-sm">
                <p className="text-foreground font-medium">{weatherDesc}</p>
                <p className="text-muted-foreground text-xs">H:{Math.round(dayWeather.high)}° L:{Math.round(dayWeather.low)}°</p>
              </div>
            </div>
            {goodForOutdoor ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20">
                <TreePine className="w-3 h-3 text-green-400" />
                <span className="text-[10px] font-semibold text-green-400">Outdoor</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20">
                <HomeIcon className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-semibold text-primary">Indoor</span>
              </div>
            )}
          </div>

          {/* 7-Day Forecast Grid */}
          <div className="relative z-10 flex justify-between gap-1.5">
            {weather.daily.time.slice(0, 7).map((dateStr, i) => {
              const date = new Date(dateStr + 'T00:00:00');
              const DayIcon = getWeatherIcon(weather.daily.weathercode[i]);
              const high = Math.round(weather.daily.temperature_2m_max[i]);
              const low = Math.round(weather.daily.temperature_2m_min[i]);
              const code = weather.daily.weathercode[i];
              const isRainy = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
              const isSnowy = [71, 73, 75, 77, 85, 86].includes(code);
              const isWindy = code >= 95;
              const isSunny = code === 0 || code === 1;
              const isCloudy = code >= 2 && code <= 48;
              
              return (
                <button 
                  key={dateStr}
                  onClick={() => setSelectedDay(i)}
                  className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-200 cursor-pointer bg-muted/40 border border-transparent hover:border-primary/30 hover:bg-muted/60 hover:scale-110 hover:z-10 hover:shadow-lg ${i === dayIndex ? 'bg-primary/20 border-primary/40' : ''}`}
                  data-testid={`weather-day-${i}`}
                >
                  <span className={`text-[9px] font-semibold mb-1 ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {i === 0 ? 'NOW' : format(date, 'EEE').toUpperCase().slice(0, 2)}
                  </span>
                  
                  <div className="relative h-8 flex items-center justify-center">
                    {isWindy ? (
                      <div className="flex items-center justify-center rounded-full px-1.5 py-1 bg-red-500/80 animate-pulse">
                        <Wind className="w-4 h-4 text-white animate-[spin_3s_linear_infinite]" />
                      </div>
                    ) : isSunny ? (
                      <Sun className="w-6 h-6 text-amber-400 animate-[pulse_2s_ease-in-out_infinite] drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    ) : isSnowy ? (
                      <div className="relative">
                        <Snowflake className="w-5 h-5 text-blue-300 animate-[spin_8s_linear_infinite] drop-shadow-[0_0_4px_rgba(147,197,253,0.5)]" />
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {[0, 1, 2].map(j => (
                            <div 
                              key={j} 
                              className="w-1 h-1 rounded-full bg-blue-300 animate-[bounce_1s_ease-in-out_infinite]" 
                              style={{ animationDelay: `${j * 0.2}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : isRainy ? (
                      <div className="relative">
                        <CloudRain className="w-5 h-5 text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.4)]" />
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {[0, 1, 2].map(j => (
                            <div 
                              key={j} 
                              className="w-0.5 h-2 rounded-full bg-blue-400 animate-[rain_0.8s_linear_infinite]" 
                              style={{ animationDelay: `${j * 0.15}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Cloud className="w-5 h-5 text-muted-foreground animate-[float_3s_ease-in-out_infinite]" />
                    )}
                  </div>
                  
                  <span className="text-[10px] font-medium text-foreground mt-1">{high}°</span>
                  <span className="text-[9px] text-muted-foreground">{low}°</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Detail Popup */}
        <Dialog open={selectedDay !== null} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="sm:max-w-md">
            {selectedDay !== null && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {(() => {
                      const code = weather.daily.weathercode[selectedDay];
                      const Icon = getWeatherIcon(code);
                      const isSunny = code === 0 || code === 1;
                      return <Icon className={`w-6 h-6 ${isSunny ? 'text-amber-400' : 'text-blue-400'}`} />;
                    })()}
                    {format(new Date(weather.daily.time[selectedDay] + 'T00:00:00'), 'EEEE, MMMM d')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div>
                      <p className="text-4xl font-light text-foreground">
                        {Math.round(weather.daily.temperature_2m_max[selectedDay])}°
                      </p>
                      <p className="text-lg text-muted-foreground font-medium">
                        {getWeatherDescription(weather.daily.weathercode[selectedDay])}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">High:</span>{' '}
                        <span className="font-medium">{Math.round(weather.daily.temperature_2m_max[selectedDay])}°F</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Low:</span>{' '}
                        <span className="font-medium">{Math.round(weather.daily.temperature_2m_min[selectedDay])}°F</span>
                      </p>
                      <p className="text-sm flex items-center justify-end gap-1">
                        <Umbrella className="w-3 h-3 text-blue-400" />
                        <span>{weather.daily.precipitation_probability_max[selectedDay]}% precip</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {isGoodOutdoorWeather(
                        weather.daily.weathercode[selectedDay],
                        weather.daily.temperature_2m_max[selectedDay],
                        weather.daily.precipitation_probability_max[selectedDay]
                      ) ? (
                        <span className="flex items-center gap-1 text-green-400">
                          <TreePine className="w-4 h-4" />
                          Great day for outdoor activities!
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-primary">
                          <HomeIcon className="w-4 h-4" />
                          Consider indoor activities for this day.
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="pt-2 border-t border-border">
                    <a 
                      href="https://open-meteo.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Weather data by Open-Meteo.com (Free API)
                    </a>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Place Suggestions */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">{suggestionMessage}</p>
          {suggestedPlaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {suggestedPlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => onPlaceClick(place)}
                  className="text-left p-2 rounded-lg bg-muted/30 hover-elevate transition-all"
                  data-testid={`weather-suggestion-${place.id}`}
                >
                  <p className="font-medium text-foreground text-xs truncate">{place.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{place.category}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No {goodForOutdoor ? "outdoor" : "indoor"} places found.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
