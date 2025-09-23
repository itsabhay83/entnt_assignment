import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
// Conditionally enable MSW in development mode

async function enableMocks() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
  if (typeof window !== 'undefined') {
    const dbModule = await import('./database/db')
    if (dbModule.DatabaseService?.initializeDatabase) {
      await dbModule.DatabaseService.initializeDatabase()
    } else if (dbModule.default) {

      console.log('DB default imported:', dbModule.default)
    }
  }
}


enableMocks().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
