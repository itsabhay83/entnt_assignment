import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Setup MSW worker
export const worker = setupWorker(...handlers)