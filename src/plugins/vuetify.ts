import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export function buildVuetify() {
  return createVuetify({
    theme: {
      defaultTheme: 'light',
    },
  })
}
