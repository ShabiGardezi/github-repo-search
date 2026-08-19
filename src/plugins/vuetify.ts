import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export function buildVuetify() {
  return createVuetify({
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          dark: false,
          colors: {
            background: '#F3F5F7',
            surface: '#FFFFFF',
            primary: '#1D4E89',
            'on-primary': '#FFFFFF',
            'on-background': '#1A202C',
            'on-surface': '#1A202C',
            error: '#C53030',
            warning: '#C05621',
            info: '#2B6CB0',
            success: '#2F855A',
          },
        },
      },
    },
    defaults: {
      VAlert: {
        rounded: 'md',
        variant: 'tonal',
      },
      VBtn: {
        rounded: 'md',
      },
      VCard: {
        rounded: 'lg',
        elevation: 0,
      },
      VProgressLinear: {
        color: 'primary',
        height: 3,
        rounded: true,
      },
      VTextField: {
        color: 'primary',
        variant: 'outlined',
      },
    },
  })
}
