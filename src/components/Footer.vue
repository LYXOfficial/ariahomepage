<script setup lang="ts">
import { onMounted, ref } from "vue";

const footerRef = ref<HTMLElement | null>(null);

const resizeFooter = () => {
  if (footerRef.value) {
    const height = footerRef.value.offsetHeight;
    document.documentElement.style.setProperty(
      "--footer-height",
      `${height}px`
    );
  }
};

onMounted(() => {
  resizeFooter();
  window.addEventListener("resize", resizeFooter);
});
</script>

<template>
  <footer class="footer" ref="footerRef">
    <span class="footer__line">
      Made with ❤️ by
      <a href="https://github.com/lyxofficial" target="_blank">Ariasaka</a>
    </span>
    <span class="footer__line">
      自豪的使用
      <a href="https://github.com/vuejs/core" target="_blank">Vue.js</a> &&
      <a href="https://github.com/vitejs/vite" target="_blank">Vite</a> ->
      <a href="https://github.com/lyxofficial/ariahomepage" target="_blank"
        >主页项目仓库</a
      >
    </span>
  </footer>
</template>

<style scoped>
.footer {
  position: absolute;
  bottom: calc(var(--footer-height, 80px) * -1);
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  padding: 10px 20px;
  text-align: center;
  background-color: var(--background-color);
  transition: bottom 0.3s ease;
  box-sizing: border-box;
  line-height: 24px;
}

.footer__line > a {
  color: var(--text-color);
  text-decoration: underline;
  transition: 0.3s;
}
.footer__line > a:hover {
  color: var(--font-color-hover);
}
</style>
