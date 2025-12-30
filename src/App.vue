<script setup lang="ts">
import { config } from "./config.ts";
import PersonalCard from "./components/PersonalCard.vue";
import ThemeSwitcher from "./components/ThemeSwitcher.vue";
import ClockWeather from "./components/ClockWeather.vue";
import Hitokoto from "./components/Hitokoto.vue";
import Links from "./components/Links.vue";
import Footer from "./components/Footer.vue";
import { onMounted } from "vue";
import Player from "./components/Player.vue";
//@ts-ignore
import Cursor from "./thirdparty/cursor.js";
onMounted(() => {
  if (!(/Mobi|Android|iPhone/i.test(navigator.userAgent))) {
    new Cursor();
  }
})
</script>

<template>
  <title>
    {{ config.title }}
  </title>
  <ThemeSwitcher />
  <Player/>
  <div class="cards-container">
    <PersonalCard />
    <ClockWeather />
    <Links />
    <Hitokoto />
  </div>
  <Footer/>
</template>

<style scoped>
.cards-container {
  display: flex;
  margin: auto;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  max-width: 475px;
  padding: 20px 0;
}
</style>
