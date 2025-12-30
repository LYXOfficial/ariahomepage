<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { ref } from "vue";

const hitokoto = ref("获取一言中...");
const loading = ref(false);

const fetchHitokoto = async () => {
  if (loading.value) return; // 防止重复点击
  loading.value = true;
  try {
    const response = await fetch("https://v1.hitokoto.cn");
    const data = await response.json();

    if (data.from && data.from_who) {
      hitokoto.value = `「${data.hitokoto}」\n——${data.from_who}《${data.from}》`;
    } else if (data.from_who) {
      hitokoto.value = `「${data.hitokoto}」\n——${data.from_who}`;
    } else {
      hitokoto.value = `「${data.hitokoto}」\n——《${data.from}》`;
    }
  } catch {
    hitokoto.value = "获取一言失败";
  } finally {
    loading.value = false;
  }
};

// 初始调用一次
fetchHitokoto();
</script>

<template>
  <div class="hitokoto card">
    <div class="hitokoto-text">{{ hitokoto }}</div>
    <button
      class="refresh-btn"
      @click="fetchHitokoto"
      :disabled="loading"
      :title="loading ? '刷新中...' : '刷新'"
      aria-label="刷新一言"
    >
      <Icon
        icon="material-symbols:refresh"
        width="24"
        height="24"
        :style="{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s' }"
      />
    </button>
  </div>
</template>

<style scoped>
.hitokoto {
  width: 475px;
  box-sizing: border-box;
  padding: 8px 20px;
  transition: color 0.3s, background-color 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
}

@media screen and (max-width: 500px) {
  .hitokoto {
    width: calc(100vw - 40px);
  }
}

.hitokoto-text {
  text-align: center;
  line-height: 20px;
  font-size: 14px;
  white-space: pre-line;
}

.refresh-btn {
  background: transparent;
  border: none;
  color: var(--font-color);
  transition: 0.3s;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
}

.refresh-btn:hover:not(:disabled) {
  color: var(--font-color-hover);
  outline: none;
}

.refresh-btn:disabled {
  cursor: lightgray;
}
</style>
