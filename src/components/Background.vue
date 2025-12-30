<script setup lang="ts">
import { config } from "../config.ts";
import { onMounted, ref, watch, nextTick } from "vue";
import { useCounterStore } from "../stores/theme";
import { storeToRefs } from "pinia";

const themeStore = useCounterStore();
const { theme } = storeToRefs(themeStore);

const bgA = ref<string>(""); // 第一层背景
const bgB = ref<string>(""); // 第二层背景
const fadeOpacityA = ref<number>(1); // 第一层透明度
const fadeOpacityB = ref<number>(0); // 第二层透明度
const currentIdx = ref<number>(-1);
let showingA = true;
let isSwitching = false;

// 预加载图片
const preloadImage = (src: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(src);
  });
};

// 获取与当前不同的随机背景
const getRandomBackground = (): { idx: number; url: string } => {
  const bgList =
    theme.value === "dark"
      ? config.darkBackgrounds
      : config.lightBackgrounds;

  if (bgList.length <= 1) {
    return { idx: 0, url: bgList[0] };
  }

  let idx: number = Math.floor(Math.random() * bgList.length);
  while (idx === currentIdx.value) {
    idx = Math.floor(Math.random() * bgList.length);
  }
  currentIdx.value = idx;
  return { idx, url: bgList[idx] };
};

// 切换背景
const updateBackground = async () => {
  if (isSwitching) return;
  isSwitching = true;

  const { url } = getRandomBackground();
  const newImg = await preloadImage(url);

  if (showingA) {
    fadeOpacityA.value = 1; // A 当前可见
    fadeOpacityB.value = 0; // B 隐藏
    await nextTick();
    requestAnimationFrame(() => {
      fadeOpacityA.value = 0; // A 淡出
      fadeOpacityB.value = 1; // B 淡入
    });
    bgB.value = newImg;
  } else {
    fadeOpacityB.value = 1; // B 当前可见
    fadeOpacityA.value = 0; // A 隐藏
    await nextTick();
    requestAnimationFrame(() => {
      fadeOpacityB.value = 0; // B 淡出
      fadeOpacityA.value = 1; // A 淡入
    });
    bgA.value = newImg;
  }

  showingA = !showingA;
  setTimeout(() => {
    isSwitching = false;
  }, 1000);
};

onMounted(async () => {
  // 初始化两张背景
  const first = getRandomBackground();
  bgA.value = await preloadImage(first.url);
  const second = getRandomBackground();
  bgB.value = await preloadImage(second.url);

  // 监听主题变化
  watch(theme, () => {
    currentIdx.value = -1;
    updateBackground();
  });
  setTimeout(updateBackground, 10);
  // 定时切换
  setInterval(updateBackground, 20000);
});

defineExpose({
  updateBackground
});
</script>

<template>
  <div class="background">
    <div
      class="bg-image"
      :style="{ backgroundImage: `url(${bgA})`, opacity: fadeOpacityA }"
    ></div>
    <div
      class="bg-image"
      :style="{ backgroundImage: `url(${bgB})`, opacity: fadeOpacityB }"
    ></div>
    <div class="bg-overlay"></div>
  </div>
</template>

<style scoped>
.background {
  position: fixed;
  z-index: -114514;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  filter: blur(4px);
  transform: scale(1.05);
  transition: opacity 1s ease-in-out, transform 4s ease;
  will-change: opacity, transform;
}
.bg-image:hover {
  transform: scale(1.1);
}
.bg-overlay {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
}
[theme="dark"] .bg-overlay {
  background-color: rgba(0, 0, 0, 0.3);
}
[theme="light"] .bg-overlay {
  background: rgba(255, 255, 255, 0.4);
}
</style>
