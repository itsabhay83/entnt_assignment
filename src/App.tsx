// App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import {Dashboard} from './pages/Dashboard'
import {JobsList} from './pages/JobsList'
import {JobDetail} from './pages/JobDetail'
import {CandidatesList} from './pages/CandidatesList'
import {CandidateProfile} from './pages/CandidateProfile'
import {AssessmentBuilder} from './pages/AssessmentBuilder'
import {AssessmentForm }from './pages/AssessmentForm'
import DatabaseDevTools from './components/DatabaseDevTools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
          return false
        }
        return failureCount < 2
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})


function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <Router>
      <Layout>
        <Routes>
          {/* Dashboard/Analytics */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard/analytics" element={<Dashboard />} />
          
          {/* Jobs Routes */}
          <Route path="/jobs" element={<JobsList />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
          
          {/* Candidates Routes */}
          <Route path="/candidates" element={<CandidatesList />} />
          <Route path="/candidates/:id" element={<CandidateProfile />} />
          
          {/* Assessment Routes */}
          <Route path="/assessments/:jobId/builder" element={<AssessmentBuilder />} />
          <Route path="/assessments/:jobId/form" element={<AssessmentForm />} />
        </Routes>
        <Toaster position="top-right" />
        <DatabaseDevTools />
      </Layout>
    </Router>
    <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App