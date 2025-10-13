export const Zhixiashi = ["北京", "上海", "天津", "重庆", "香港", "澳门"];

export const wiMapping: Record<string, string> = {
  '100': 'wi:day-sunny',          // 晴
  '150': 'wi:night-clear',        // 晴（夜间）
  '101': 'wi:day-cloudy',         // 多云
  '151': 'wi:night-alt-cloudy',   // 多云（夜间）
  '102': 'wi:cloud',              // 阴
  '103': 'wi:cloudy',             // 云量大的阴天
  '104': 'wi:cloud',              // 极度阴（类似厚云）
  '300': 'wi:day-showers',        // 阵雨
  '301': 'wi:rains',              // 雷阵雨
  '302': 'wi:day-thunderstorm',   // 雷阵雨并伴有冰雹
  '303': 'wi:storm-showers',      // 强雷阵雨
  '304': 'wi:hail',               // 冰雹
  '305': 'wi:day-rain-mix',       // 小雨
  '306': 'wi:rain',               // 中雨
  '307': 'wi:showers',            // 大雨
  '308': 'wi:rain-wind',          // 暴雨
  '309': 'wi:heavy-rain',         // 大暴雨
  '310': 'wi:rain-mix',           // 特大暴雨
  '400': 'wi:snow',               // 小雪
  '401': 'wi:sleet',              // 中雪
  '402': 'wi:snow-wind',          // 大雪
  '403': 'wi:snowflake-cold',     // 暴雪
  '404': 'wi:rain-mix',           // 雨夹雪
  '405': 'wi:rain-mix',           // 雨加冰雹
  '406': 'wi:day-snow',           // 阵雪
  '407': 'wi:day-sleet',          // 阵雨夹雪
  '500': 'wi:fog',                // 雾
  '501': 'wi:windy',              // 沙尘暴
  '502': 'wi:sandstorm',          // 强沙尘暴
  '503': 'wi:snow-wind',          // 浮尘
  '504': 'wi:smoke',              // 扬尘
  '507': 'wi:cloudy-gusts',       // 强浓雾
  '508': 'wi:cloudy-gusts',       // 浓雾
  '900': 'wi:volcano',            // 热带风暴
  '901': 'wi:hurricane',          // 飓风
  '999': 'wi-na',                 // 未知
};

export interface LocationData {
  ip: string;
  country: string;
  province: string;
  city: string;
  area: string;
  isp: string;
  region: string;
  country_id: string;
}
export interface City {
  city?: string;
  country: string;
  district?: string;
  ip: string;
  isp: string;
  province?: string;
}
export interface CityCodeRep {
  code: string;
  location: Array<{
    name: string;
    id: string;
    lat: string;
    lon: string;
    adm2: string;
    adm1: string;
    country: string;
  }>;
  msg: string;
  status: boolean;
}
export interface WeatherRep {
  code: string;
  fxLink: string;
  now: Weather;
  updateTime: string;
}
export interface Weather {
  cloud: string;
  dew: string;
  feelsLike: string;
  humidity: string;
  icon: string;
  obsTime: string;
  precip: string;
  pressure: string;
  temp: string;
  text: string;
  vis: string;
  wind360: string;
  windDir: string;
  windScale: string;
  windSpeed: string;
}

export enum Unloaded {
  Loading,
  Error,
}
