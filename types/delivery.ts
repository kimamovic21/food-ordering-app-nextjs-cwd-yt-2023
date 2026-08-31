export type LocationData = {
  latitude: number;
  longitude: number;
};

export type WeatherData = {
  condition: 'clear' | 'rain' | 'snow' | 'storm';
  temperature: number;
  windSpeed: number;
};

export type FeeBreakdown = {
  baseFee: number;
  weatherAdjustment: number;
  totalAdjustment: number;
  totalFee: number;
  weather?: WeatherData;
};
