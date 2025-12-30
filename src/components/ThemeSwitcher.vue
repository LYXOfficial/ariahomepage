<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { ref, onMounted } from "vue";
import { useCounterStore } from "../stores/theme";
import Background from "./Background.vue"; // 引入背景组件

const theme = ref("light");
const themeStore = useCounterStore();
const backgroundRef = ref<InstanceType<typeof Background> | null>(null);
const isSwitching = ref(false);

onMounted(() => {
  theme.value =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark");
  themeStore.setTheme(theme.value);
  document.body.setAttribute("theme", theme.value);
});

function toggleTheme() {
  if(isSwitching.value) return;
  isSwitching.value = true;
  theme.value = theme.value === "dark" ? "light" : "dark";
  themeStore.setTheme(theme.value);
  document.body.setAttribute("theme", theme.value);
  localStorage.setItem("theme", theme.value);
  setTimeout(() => {
    isSwitching.value = false;
  }, 1000);
}

// 手动切换背景
function switchBackground() {
  if(isSwitching.value) return;
  isSwitching.value = true;
  backgroundRef.value?.updateBackground();
  setTimeout(() => {
    isSwitching.value = false;
  }, 1000);
}
</script>

<template>
  <Background ref="backgroundRef" />
  <button class="theme-switcher toggleLightDark" @click="toggleTheme">
    <Icon
      :icon="`material-symbols-light:${
        theme == 'dark' ? 'light' : 'dark'
      }-mode-rounded`"
      width="24"
      height="24"
    />
  </button>
  <button class="theme-switcher switchBackground" @click="switchBackground">
    <Icon icon="ri:image-line" width="24" height="24" />
  </button>
</template>

<style scoped>
.theme-switcher {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  position: relative;
  z-index: 10;
  box-shadow: var(--card-shadow);
  color: var(--font-color);
  background-color: var(--background-color);
  position: fixed;
  transition: 0.3s;
  outline: none;
}
.toggleLightDark {
  top: 20px;
  right: 20px;
}
.switchBackground {
  top: 20px;
  right: 80px;
  transition: 0.3s;
}
@media screen and (max-width: 500px) {
  .theme-switcher {
    width: 30px;
    height: 30px;
  }
}
.theme-switcher:hover {
  background-color: var(--background-color-hover);
}
</style>
