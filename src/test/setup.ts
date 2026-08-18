import { config } from '@vue/test-utils'
import { buildVuetify } from '@/plugins/vuetify'

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserverStub
}

config.global.plugins = [buildVuetify()]
