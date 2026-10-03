import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Self-hosted fonts (no third-party requests, faster first paint)
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/jost/latin-400.css'
import '@fontsource/jost/latin-500.css'
import '@fontsource/marcellus/latin-400.css'
import './index.css'
import App from './App'
import { StoreProvider } from './context/StoreContext'
import { AuthProvider } from './context/AuthContext'
import { loadSettings } from './config/site'
import { productService } from './services/productService'

const root = createRoot(document.getElementById('root')!)

function Unavailable({ retry }: { retry: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-ivory px-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <p className="font-brand text-[24px] tracking-[0.2em]">SIRNAAZ</p>
        <p className="font-display text-[24px]">We'll be right back</p>
        <p className="text-[14px] text-ink-soft">The shop couldn't load just now. Please check your connection and try again.</p>
        <button className="btn-primary" onClick={retry}>Try again</button>
      </div>
    </div>
  )
}

async function boot() {
  try {
    await Promise.all([loadSettings(), productService.load()])
  } catch {
    root.render(<Unavailable retry={boot} />)
    return
  }
  root.render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <StoreProvider>
            <App />
          </StoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
}
boot()
