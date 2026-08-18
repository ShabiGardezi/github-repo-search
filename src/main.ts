import { createApp } from 'vue'
import App from './App.vue'
import { buildVuetify } from './plugins/vuetify'
import './styles/main.scss'

createApp(App).use(buildVuetify()).mount('#app')
