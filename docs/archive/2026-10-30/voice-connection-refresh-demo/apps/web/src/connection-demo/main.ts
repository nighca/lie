import { createApp } from 'vue'

import '@lie/ui/style.css'
import '../style.css'
import ConnectionDemo from './ConnectionDemo.vue'

if (import.meta.env.DEV) createApp(ConnectionDemo).mount('#app')
