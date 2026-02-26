import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import { initializeAuthToken } from './utils/authToken.js'

const isBrowser = typeof window !== 'undefined'
const hostname = isBrowser ? window.location.hostname : ''
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
const routerMode = String(import.meta.env.VITE_ROUTER_MODE || '').toLowerCase()
const allowBrowserRouterInProd = String(import.meta.env.VITE_ALLOW_BROWSER_ROUTER_PROD || '').toLowerCase() === 'true'

const shouldUseHashRouter =
  routerMode === 'hash' ||
  (
    routerMode === 'browser'
      ? (import.meta.env.PROD && !isLocalhost && !allowBrowserRouterInProd)
      : (
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

const CHUNK_RECOVERY_KEY = 'Learnify:chunk-recovery'
const CHUNK_RECOVERY_INSTALLED = '__LearnifyChunkRecoveryInstalled__'

const isChunkLoadFailure = (errorLike) => {
  const message = String(
    errorLike?.message ||
    errorLike?.reason?.message ||
    errorLike ||
    ''
  )
  return /ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module|Importing a module script failed/i.test(message)
}

if (isBrowser && !window[CHUNK_RECOVERY_INSTALLED]) {
  window[CHUNK_RECOVERY_INSTALLED] = true

  const recoverFromChunkFailure = (errorLike) => {
    if (!isChunkLoadFailure(errorLike)) return
    const alreadyReloaded = window.sessionStorage.getItem(CHUNK_RECOVERY_KEY) === '1'
    if (alreadyReloaded) return
    window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1')
    window.location.reload()
  }

  window.addEventListener('error', (event) => {
    recoverFromChunkFailure(event.error || event.message)
  })

  window.addEventListener('unhandledrejection', (event) => {
    recoverFromChunkFailure(event.reason)
  })

  window.addEventListener('load', () => {
    window.sessionStorage.removeItem(CHUNK_RECOVERY_KEY)
  }, { once: true })
}

initializeAuthToken()

createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <Router>
      <Provider store={store}>
        <App />
      </Provider>
    </Router>
  </AppErrorBoundary>
)
