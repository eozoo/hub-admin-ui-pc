import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'nprogress/nprogress.css'
import App from './App.vue'
import 'virtual:svg-icons-register'
import router from './router'
import { pinia } from './stores'
import { i18n } from './locales'
import { setupPermissionDirectives } from './directives/permission'
import DictTag from './components/DictTag/index.vue'
import SvgIcon from './components/SvgIcon/index.vue'
import './styles/index.scss'

const app = createApp(App)

app.use(pinia)
app.use(i18n)
app.use(router)
app.use(ElementPlus)
app.component('DictTag', DictTag)
app.component('SvgIcon', SvgIcon)
setupPermissionDirectives(app)
app.mount('#app')
