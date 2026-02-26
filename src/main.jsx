import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'

const isBrowser = typeof window !== 'undefined'
const hostname = isBrowser ? window.location.hostname : ''
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
const routerMode = String(import.meta.env.VITE_ROUTER_MODE || '').toLowerCase()

const shouldUseHashRouter =
  routerMode === 'hash' ||
  (
    routerMode !== 'browser' &&
    (
      import.meta.env.VITE_USE_HASH_ROUTER === 'true' ||
      (import.meta.env.PROD && !isLocalhost)
    )
  )

if (isBrowser && shouldUseHashRouter && !window.location.hash.startsWith('#/')) {
  const deepLinkPath = `${window.location.pathname}${window.location.search}`
  if (deepLinkPath !== '/') {
    window.history.replaceState(null, '', `/#${deepLinkPath}`)
  }
}

const Router = shouldUseHashRouter ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')).render(
  <Router>
  <Provider store={store}>
    <App />
  </Provider>
  </Router>
  
)
