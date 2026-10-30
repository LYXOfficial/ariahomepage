<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { config } from "../config";
import { Icon } from "@iconify/vue";
import type {
  City,
  Weather,
  CityCodeRep,
  WeatherRep,
  LocationData,
} from "../interfaces/weather";
import { Unloaded, wiMapping } from "../interfaces/weather";

const city = ref<City | Unloaded>(Unloaded.Loading);
const weatherNow = ref<Weather | Unloaded>(Unloaded.Loading);
const time = ref<string>("07:21");
const date = ref<string>("1919-08-10");
const loading = ref(false);

// 展示用：去掉行政区划后缀，免得“重庆市 两江新区”叠在一起
function removeSuffix(name?: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  // “两江新区”“高新区”去掉“区”会变成“两江新”“高新”，这类名字整段保留
  if (/(新区|开发区|管理区|高新区)$/u.test(trimmed)) return trimmed;
  return trimmed.replace(/(特别行政区|自治区|市|县|区|省)$/u, "");
}

// 区划变动：渝北区、江北区已并入两江新区，QWeather 的城市库也已下架“渝北”
//（直接查会 400，“两江新区”才有条目），但 IP 定位库还停在旧名字上。
// 这里只在重庆范围内改名，避免把宁波“江北区”这类同名区也误伤掉。
const REGION_ALIASES: Record<string, string> = {
  "重庆|渝北区": "两江新区",
  "重庆|渝北": "两江新区",
  "重庆|江北区": "两江新区",
  "重庆|江北": "两江新区",
};

// 查询用：QWeather 的地理编码不认“北碚区”“渝北区”这种带后缀的写法，
// 查不到就会返回 400，所以再兜一层，尽量还原成它库里的地名（“北碚”）。
// 民族自治区还要再去掉“壮族”“维吾尔”这类前缀，否则同样匹配不到。
function stripRegionSuffix(name?: string): string {
  if (!name) return "";
  return name
    .replace(/(特别行政区|自治区|自治州|地区|新区|市|县|区|省)$/u, "")
    .replace(
      /(壮族|回族|维吾尔|藏族|蒙古|苗族|彝族|侗族|白族|傣族|哈尼族|布依族|土家族|朝鲜族|满族|瑶族|畲族|黎族|羌族|傈僳族|拉祜族|景颇族|仡佬族|水族|东乡族|保安族|撒拉族|土族|裕固族|毛南族|京族|独龙族|怒族|普米族|德昂族|阿昌族|基诺族|门巴族|珞巴族)$/u,
      ""
    )
    .trim();
}

// 省 + 区县一起判断，拿到当前该用的名字；没登记的保持原样
function renameRegion(name?: string, province?: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  const key = `${stripRegionSuffix(province)}|${stripRegionSuffix(trimmed)}`;
  return REGION_ALIASES[key] ?? trimmed;
}

// QWeather 的专用域名对结尾斜杠很敏感：带斜杠会直接 404 且响应体为空。
// 以前拼 URL 时写了 `/geo/v2/city/lookup/`，天气就整块变成 --°C。
function qweatherUrl(
  path: string,
  params: Record<string, string | undefined>
): string {
  const url = new URL(`https://${config.HF_Host}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  url.searchParams.set("key", config.HF_Key);
  return url.toString();
}

/**
 * 把 IP 定位结果换成 QWeather 城市代码。
 * 定位接口给的是“渝北区”“北碚区”这类区县名，而 QWeather 的城市库里
 * 不一定有对应条目（渝北就没有），只查一次会 400，于是按
 * 区县 → 去后缀的区县 → 省 → 国家 逐级降级，直到拿到一个可用 id。
 */
async function lookupCityCode(location: LocationData): Promise<string> {
  const candidates: Array<{ location: string; adm?: string }> = [];
  const seen = new Set<string>();
  const add = (name?: string, adm?: string) => {
    const locationName = (name ?? "").trim();
    if (!locationName) return;
    const admName = (adm ?? "").trim();
    const key = `${locationName}|${admName}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ location: locationName, adm: admName || undefined });
  };

  for (const base of [
    location.city,
    location.area,
    location.province,
    location.country,
  ]) {
    add(base, location.province);
    add(stripRegionSuffix(base), stripRegionSuffix(location.province));
    add(stripRegionSuffix(base));
    add(base);
  }

  for (const candidate of candidates) {
    const res = await fetch(
      qweatherUrl("/geo/v2/city/lookup", {
        location: candidate.location,
        adm: candidate.adm,
        lang: "zh",
      })
    );
    // 400 只代表这个地名不在库里，换下一个候选；不能据此直接判整次失败
    if (!res.ok) continue;
    const json: CityCodeRep = await res.json();
    const id = json.code === "200" ? json.location?.[0]?.id : undefined;
    if (id) return id;
  }

  throw new Error("没有找到可用的城市代码");
}

function dayProgress() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const passedMs = now.getTime() - start.getTime();
  const totalMs = end.getTime() - start.getTime();
  return { passed: passedMs, total: totalMs };
}

function monthProgress() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  const passedMs = now.getTime() - start.getTime();
  const totalMs = end.getTime() - start.getTime();
  const totalDays = end.getDate();
  const passedDays = now.getDate();
  return { passed: passedDays, total: totalDays, passedMs, totalMs };
}

function yearProgress() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  const passedMs = now.getTime() - start.getTime();
  const totalMs = end.getTime() - start.getTime();
  const totalDays =
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const passedDays =
    Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return { passed: passedDays, total: totalDays, passedMs, totalMs };
}

// 新增：计算本周进度
function weekProgress() {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // 周一是第一天
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const passedMs = now.getTime() - start.getTime();
  const totalMs = end.getTime() - start.getTime();

  const passedDays = Math.floor(passedMs / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = 7;

  return { passed: passedDays, total: totalDays, passedMs, totalMs };
}

function updateTimeDate() {
  const now = new Date();
  time.value = now.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  const w = now.toLocaleDateString("zh-CN", { weekday: "short" });
  date.value = `${y}-${m}-${d} ${w}`;
}

async function refreshWeather() {
  if (loading.value) return;
  loading.value = true;

  city.value = Unloaded.Loading;
  weatherNow.value = Unloaded.Loading;

  try {
    const locationRep = await fetch("https://api.mir6.com/api/ip?type=json", {
      method: "GET",
      referrerPolicy: "no-referrer",
    });
    if (!locationRep.ok) throw new Error("位置请求失败");
    const locationData: { code: number; msg: string; data: LocationData } = await locationRep.json();
    
    if (locationData.code !== 200 || !locationData.data) throw new Error("位置数据格式错误");
    const location = locationData.data;

    // 旧的行政区划名先映射成现在的名字，展示和查天气都用同一份
    const provinceName = renameRegion(location.province);
    const cityName = renameRegion(location.city, location.province);

    // 转换 mir6 格式到旧格式
    const cityData: City = {
      country: location.country || "中国",
      province: provinceName,
      city: cityName,
      ip: location.ip || "",
      isp: location.isp || "",
    };
    city.value = cityData; // 先赋值城市

    const cityCode = await lookupCityCode({
      ...location,
      province: provinceName,
      city: cityName,
    });
    const weatherRep = await fetch(
      qweatherUrl("/v7/weather/now", { location: cityCode })
    );
    if (!weatherRep.ok) throw new Error("天气请求失败");
    const weather: WeatherRep = await weatherRep.json();
    if (weather.code !== "200" || !weather.now) throw new Error("天气状态错误");

    weatherNow.value = weather.now; // 天气赋值成功
  } catch (e) {
    if (city.value === Unloaded.Loading) {
      city.value = Unloaded.Error;
    }
    weatherNow.value = Unloaded.Error;
    console.error(e);

    // 网络/接口偶发抽风时自动再试一次，不用麻烦用户手动刷新
    if (!retried) {
      retried = true;
      retryTimer = window.setTimeout(() => {
        retryTimer = undefined;
        refreshWeather();
      }, 5000);
    }
  } finally {
    loading.value = false;
  }
}

const dayProg = computed(() => {
  const { passed, total } = dayProgress();
  const percent = (passed / total) * 100;
  return {
    passedHours: (passed / (1000 * 60 * 60)).toFixed(0),
    totalHours: 24,
    percent: percent.toFixed(2),
  };
});

const monthProg = computed(() => {
  const { passed, total } = monthProgress();
  const percent = (passed / total) * 100;
  return {
    passedDays: passed,
    totalDays: total,
    percent: percent.toFixed(2),
  };
});

const yearProg = computed(() => {
  const { passed, total } = yearProgress();
  const percent = (passed / total) * 100;
  return {
    passedDays: passed,
    totalDays: total,
    percent: percent.toFixed(2),
  };
});

// 新增本周计算属性
const weekProg = computed(() => {
  const { passed, total } = weekProgress();
  const percent = (passed / total) * 100;
  return {
    passedDays: passed,
    totalDays: total,
    percent: percent.toFixed(2),
  };
});

// 计时器与自动重试都要在卸载时收掉，否则组件反复挂载会叠出多个定时器
let clockTimer: number | undefined;
let retryTimer: number | undefined;
let retried = false;

onMounted(() => {
  updateTimeDate();
  clockTimer = window.setInterval(updateTimeDate, 1000);
  refreshWeather();
});

onUnmounted(() => {
  if (clockTimer !== undefined) window.clearInterval(clockTimer);
  if (retryTimer !== undefined) window.clearTimeout(retryTimer);
});
</script>

<template>
  <div class="flip-container">
    <div class="clock-weather card">
      <div class="front">
        <div class="clock">
          <div class="time">{{ time }}</div>
          <div class="date">{{ date }}</div>
        </div>
        <div class="weather">
          <!-- wi:na 这个图标本身画的就是“N/A”字样，出错时看着像页面坏了，
               所以加载中/失败分别换成云图标，失败时再给个手动重试入口 -->
          <Icon
            v-if="weatherNow === Unloaded.Loading"
            icon="mdi:cloud-outline"
            class="weather-icon"
            width="30px"
            height="30px"
          />
          <Icon
            v-else-if="weatherNow === Unloaded.Error"
            icon="mdi:cloud-off-outline"
            class="weather-icon"
            width="30px"
            height="30px"
            title="天气获取失败，正在自动重试"
          />
          <Icon
            v-else
            :icon="wiMapping[weatherNow.icon] ?? 'wi:na'"
            class="weather-icon"
            width="30px"
            height="30px"
          />
          <div class="weather-text">
            <div
              v-if="city !== Unloaded.Loading && city !== Unloaded.Error"
              class="city"
            >
              <span v-if="city.country !== '中国'">{{
                removeSuffix(city.country) + " "
              }}</span>
              <!-- 直辖市也要带上名字（“重庆 两江新区”），只有省市同名时才省略重复的那层 -->
              <span v-if="city.province">{{ removeSuffix(city.province) + " " }}</span>
              <span
                v-if="
                  city.city &&
                  removeSuffix(city.city) !== removeSuffix(city.province)
                "
                >{{ removeSuffix(city.city) + " " }}</span
              >
              <span
                v-if="
                  city.district &&
                  removeSuffix(city.district) !== removeSuffix(city.city)
                "
                >{{ removeSuffix(city.district) }}</span
              >
            </div>
            <div v-else-if="city === Unloaded.Loading" class="city">
              获取中...
            </div>
            <div v-else class="city">获取失败</div>

            <div
              v-if="
                weatherNow !== Unloaded.Loading && weatherNow !== Unloaded.Error
              "
              class="temperature"
              :title="`${weatherNow.text} ${weatherNow?.temp}°C`"
            >
              {{ weatherNow.text + " " + weatherNow?.temp }}°C
            </div>
            <div v-else class="temperature">--°C</div>
          </div>
          <button
            class="refresh-btn"
            :class="{ 'refresh-btn-visible': weatherNow === Unloaded.Error }"
            @click="refreshWeather"
            :disabled="loading"
            :title="loading ? '刷新中...' : '刷新天气'"
          >
            <Icon icon="mdi:refresh" width="20" height="20" />
          </button>
        </div>
      </div>

      <div class="back">
        <div class="time-during-item">
          <Icon icon="solar:sun-bold" width="16" height="16" />
          <span class="time-during-text">
            今日已过去 {{ dayProg.passedHours }} / {{ dayProg.totalHours }} 小时
          </span>
          <div class="time-during-bar">
            <div
              class="time-during-bar-inner"
              :style="{ width: dayProg.percent + '%' }"
            ></div>
          </div>
        </div>
        <div class="time-during-item">
          <Icon icon="lets-icons:date-fill" width="16" height="16" />
          <span class="time-during-text">
            本周已过去 {{ weekProg.passedDays }} / {{ weekProg.totalDays }} 天
          </span>
          <div class="time-during-bar">
            <div
              class="time-during-bar-inner"
              :style="{ width: weekProg.percent + '%' }"
            ></div>
          </div>
        </div>
        <div class="time-during-item">
          <Icon icon="mynaui:moon-solid" width="16" height="16" />
          <span class="time-during-text">
            本月已过去 {{ monthProg.passedDays }} / {{ monthProg.totalDays }} 天
          </span>
          <div class="time-during-bar">
            <div
              class="time-during-bar-inner"
              :style="{ width: monthProg.percent + '%' }"
            ></div>
          </div>
        </div>
        <div class="time-during-item">
          <Icon icon="material-symbols:star-rounded" width="16" height="16" />
          <span class="time-during-text">
            本年已过去 {{ yearProg.passedDays }} / {{ yearProg.totalDays }} 天
          </span>
          <div class="time-during-bar">
            <div
              class="time-during-bar-inner"
              :style="{ width: yearProg.percent + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flip-container {
  width: 180px;
  height: 150px;
  /* perspective: 1000px; */
  position: relative;
}

.clock-weather.card {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  transition: transform 1s, color 0.3s, background-color 0.3s;
  transform-style: preserve-3d;
  position: relative;
}

.flip-container:hover .clock-weather.card {
  transform: rotateY(-180deg);
}

.front,
.back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-wrap: wrap;
  left: 0;
  top: 0;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  padding: 15px;
}

.front {
  transform: rotateY(0deg);
  text-align: center;
}

.back {
  transform: rotateY(180deg);
}

/* 你已有的样式保留 */
.weather {
  display: flex;
  justify-content: center;
  align-items: center;
}
.weather-text {
  line-height: 22px;
  margin-left: 5px;
  margin-right: 10px;
}
.time {
  font-size: 30px;
  font-weight: 600;
  line-height: 32px;
}
.date {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}
.temperature,
.city {
  /* “重庆 两江新区”这种省+区全名要 101px 左右，90px 会被截成“重庆 两江…”，
     卡片内宽 150px 减去图标和边距后正好放得下 104px */
  max-width: 104px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.refresh-btn {
  background: transparent;
  border: none;
  color: var(--font-color);
  cursor: pointer;
  margin: 8px;
  height: 24px;
  display: flex;
  align-items: center;
  padding: 0;
  transition: 0.3s;
  display: none;
}
/* 平时不占位，天气失败时才露出来，给用户一个手动重试的入口 */
.refresh-btn-visible {
  display: flex;
}
.refresh-btn:hover:not(:disabled) {
  color: var(--font-color-hover);
  outline: none;
}
.refresh-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.time-during-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}
.time-during-text {
  margin-left: 5px;
}
.time-during-text {
  font-size: 11px;
}
.time-during-bar {
  width: 100%;
  height: 2px;
  background-color: var(--background-color);
  margin: 2px 0;
  position: relative;
}
.time-during-bar-inner {
  height: 100%;
  background-color: var(--font-color);
  position: absolute;
  left: 0;
  top: 0;
}
@media screen and (max-width: 500px) {
  .flip-container {
    width: calc(100vw - 40px);
    height: 110px;
  }
  .clock-weather.card {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .front {
    flex-direction: row;
    justify-content: flex-start;
  }
  .clock {
    margin-right: 10px;
    transform: translateY(5px);
    margin-left: auto;
  }
  .weather {
    margin: auto auto auto 0;
  }
}

@media screen and (min-width: 360px) and (max-width: 500px) {
  .back {
    display: grid;
    grid-template-columns: 50% 50%;
    grid-template-rows: 50% 50%;
    padding: 25px 15px;
  }
}

@media screen and (max-width: 360px) {
  .flip-container {
    height: 150px;
  }
  .weather {
    margin: auto !important;
  }
  .clock {
    margin: auto !important;
  }
  .time-during-item {
    padding: 0 5px;
  }
}

@media screen and (max-width: 250px) {
  .time {
    font-size: 24px !important;
  }
  .date {
    max-width: 100px;
  }
}
</style>
