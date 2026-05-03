import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

if ('scrollRestoration' in window.history) {
	window.history.scrollRestoration = 'manual'
}

const app = createApp(App)
app.use(router)
app.mount('#app')
