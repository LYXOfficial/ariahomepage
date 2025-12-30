<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";
import { config } from "../config";

const fullText = ref(config.description);
const displayedText = ref("");
const cursorVisible = ref(true);

let typingTimer: number | null = null;
let blinkingTimer: number | null = null;

const typingSpeed = 200; // 打字间隔ms
const deletingSpeed = 100; // 删除间隔ms
const pauseTime = 1800; // 停顿时间ms

function startTypingAnimation() {
  let index = 0;
  let deleting = false;

  // 停止任何闪烁，光标常亮
  if (blinkingTimer) {
    clearInterval(blinkingTimer);
    blinkingTimer = null;
  }
  cursorVisible.value = true;

  typingTimer = window.setInterval(() => {
    if (!deleting) {
      // 打字阶段
      displayedText.value = fullText.value.slice(0, index + 1);
      index++;
      if (index === fullText.value.length) {
        clearInterval(typingTimer!);
        typingTimer = null;

        // 停顿阶段，开启闪烁
        blinkingTimer = window.setInterval(() => {
          cursorVisible.value = !cursorVisible.value;
        }, 500);

        setTimeout(() => {
          // 停顿结束，关闭闪烁，光标常亮，开始删除
          if (blinkingTimer) {
            clearInterval(blinkingTimer);
            blinkingTimer = null;
          }
          cursorVisible.value = true;
          deleting = true;

          typingTimer = window.setInterval(() => {
            // 删除阶段
            displayedText.value = fullText.value.slice(0, index - 1);
            index--;
            if (index === 0) {
              clearInterval(typingTimer!);
              typingTimer = null;

              // 停顿阶段，开启闪烁
              blinkingTimer = window.setInterval(() => {
                cursorVisible.value = !cursorVisible.value;
              }, 500);

              setTimeout(() => {
                // 停顿结束，关闭闪烁，光标常亮，重新开始打字
                if (blinkingTimer) {
                  clearInterval(blinkingTimer);
                  blinkingTimer = null;
                }
                cursorVisible.value = true;
                deleting = false;
                startTypingAnimation();
              }, pauseTime);
            }
          }, deletingSpeed);
        }, pauseTime);
      }
    }
  }, typingSpeed);
}

onMounted(() => {
  startTypingAnimation();
});

onUnmounted(() => {
  if (typingTimer) clearInterval(typingTimer);
  if (blinkingTimer) clearInterval(blinkingTimer);
});
</script>

<template>
  <div class="personal">
    <div class="personal-content card">
      <div class="personal-front">
        <img class="avatar" :src="config.avatar" alt="Avatar" />
        <span class="author">{{ config.author }}</span>
        <span class="description">
          {{ displayedText }}<span class="cursor" v-show="cursorVisible">|</span>
        </span>
      </div>
      <div class="personal-back">
        <span class="back-description">{{ config.backDescription }}</span>
        <div class="socials">
          <a
            class="social-link"
            v-for="social in config.socials"
            :key="social.name"
            :href="social.url"
            :title="social.name"
            target="_blank"
          >
            <Icon
              class="icon-iconify"
              v-if="social.icon"
              :icon="social.icon"
              width="24"
              height="24"
            />
            <span
              class="icon-html"
              v-else-if="social.iconHtml"
              v-html="social.iconHtml"
            ></span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.personal-content {
  width: 250px;
  height: 120px;
  transition: 1s transform, 0.3s color, 0.3s background-color;
  transform-style: preserve-3d;
  position: relative;
}

@media screen and (max-width: 500px) {
  .personal-content {
    width: calc(100vw - 70px);
    height: 100px;
  }
}
@media screen and (max-width: 320px) {
  .personal-content {
    height: 150px;
  }
  .avatar {
    margin-right: 0 !important;
  }
  .author {
    width: 100%;
    text-align: center;
  }
}
@media screen and (max-width: 250px) {
  .author {
    font-size: 24px !important;
  }
}

.personal:hover .personal-content {
  transform: rotateY(180deg);
}
.personal-front,
.personal-back {
  display: flex;
  flex-wrap: wrap;
  backface-visibility: hidden;
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 15px;
  box-sizing: border-box;
  left: 0;
  top: 0;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
  will-change: transform;
}
.personal-front {
  transform: rotateY(0deg);
}
.personal-back {
  transform: rotateY(180deg);
}
.author {
  font-size: 40px;
  font-weight: 600;
  line-height: 40px;
}
.description {
  line-height: 18px;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
  white-space: pre-wrap;
  overflow: hidden;
  font-size: 14px;
  width: 100%;
  min-height: 18px;
}
.cursor {
  display: inline-block;
  width: 8px;
  color: var(--font-color);
  animation: blink .5s steps(2, start) infinite;
  transform: translateX(-3px);
}
@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  50.01%,
  100% {
    opacity: 0;
  }
}
.personal-back .back-description {
  margin: auto;
  width: 100%;
  text-align: center;
}
.socials {
  margin: auto;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}
.social-link {
  color: var(--font-color);
  fill: var(--font-color);
  text-decoration: none;
  width: 24px;
  height: 24px;
  transition: 0.3s;
}
.social-link:hover {
  color: var(--font-color-hover);
  fill: var(--font-color-hover);
}
.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 16px;
  border: 2px solid #fffa;
  transition: 0.3s;
}
</style>
