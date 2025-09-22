import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const { worker } = await import('./mocks/browser')
  return worker.start({
    onUnhandledRequest: 'warn',
  })
}
enableMocking().then(() => {
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* <div className="bg-blue-500 text-white p-4 rounded">
  Tailwind Test</div> */}

  </StrictMode>,
  )
})