import { defineStore } from "pinia"

export const useCounterStore = defineStore('counter', {
  state: () => ({ theme: 'light' }),
  actions: {
    setTheme(theme: string) {
      this.theme = theme;
    },
  },
})