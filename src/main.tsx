import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import  seedData  from './database/db'
import './index.css'
async function enableMocks() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    worker.start({ onUnhandledRequest: 'bypass' })
  } else {
    // Production: ensure DB is seeded
    await seedData
  }
}

enableMocks().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
