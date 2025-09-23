import {Users, Briefcase, TrendingUp, Clock } from 'lucide-react'
import { useJobs, useCandidates } from '../hooks/api'
import type { Candidate } from '../types'
import CreateJobModal from '../components/CreateJobModal'
import { useState } from 'react'
export const Dashboard = () => {
  // Fetch real data using your API hooks
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ page: 1, limit: 100 })
  const { data: candidatesData, isLoading: candidatesLoading } = useCandidates({ page: 1, limit: 100 })

  // Calculate stats from real data
  const totalJobs = jobsData?.data?.pagination.total || 0
  const activeJobs = jobsData?.data?.data?.filter(job => job.status === 'active').length || 0
  const totalCandidates = candidatesData?.data?.pagination.total || 0
  const activeCandidates = candidatesData?.data?.data?.filter(
    candidate => !['rejected', 'hired'].includes(candidate.stage)
  ).length || 0
  const hiredCandidates = candidatesData?.data?.data?.filter(
    candidate => candidate.stage === 'hired'
  ).length || 0
  const successRate = totalCandidates > 0 ? Math.round((hiredCandidates / totalCandidates) * 100) : 0

  const stats = [
    { 
      name: 'Total Jobs', 
      value: jobsLoading ? '...' : totalJobs.toString(), 
      icon: Briefcase, 
      change: `${activeJobs} active`, 
      changeType: 'info' as const
    },
    { 
      name: 'Active Candidates', 
      value: candidatesLoading ? '...' : activeCandidates.toString(), 
      icon: Users, 
      change: `${totalCandidates} total`, 
      changeType: 'info' as const
    },
    { 
      name: 'In Progress', 
      value: candidatesLoading ? '...' : (candidatesData?.data?.data?.filter(
        candidate => ['assessment', 'interview'].includes(candidate.stage)
      ).length || 0).toString(), 
      icon: Clock, 
      change: 'assessments + interviews', 
      changeType: 'info' as const
    },
    { 
      name: 'Success Rate', 
      value: candidatesLoading ? '...' : `${successRate}%`, 
      icon: TrendingUp, 
      change: `${hiredCandidates} hired`, 
      changeType: 'success' as const
    },
  ]

  // Get recent activities from candidates data
  const recentActivities = candidatesData?.data?.data
    ?.slice(0, 5) // Get last 5 candidates
    ?.map(candidate => {
      const timeAgo = getTimeAgo(new Date(candidate.updatedAt || candidate.createdAt))
      
      switch (candidate.stage) {
        case 'applied':
          return {
            id: candidate.id,
            message: `New candidate ${candidate.name} applied`,
            time: timeAgo,
            type: 'application'
          }
        case 'assessment':
          return {
            id: candidate.id,
            message: `${candidate.name} started assessment`,
            time: timeAgo,
            type: 'assessment'
          }
        case 'interview':
          return {
            id: candidate.id,
            message: `Interview scheduled for ${candidate.name}`,
            time: timeAgo,
            type: 'interview'
          }
        case 'hired':
          return {
            id: candidate.id,
            message: `${candidate.name} has been hired!`,
            time: timeAgo,
            type: 'success'
          }
        default:
          return {
            id: candidate.id,
            message: `${candidate.name} status updated`,
            time: timeAgo,
            type: 'update'
          }
      }
    }) || []
    const [open , setopen] = useState(false);
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back! Here's what's happening with your recruitment.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      <div className={`ml-2 flex items-baseline text-sm font-medium ${
                        stat.changeType === 'success' ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="px-6 py-4">
          {candidatesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.type)}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button onClick={() => setopen(true)} className="w-full text-left px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors">
              Create New Job Posting
            </button>
            
          </div>
          <CreateJobModal isOpen={open} onClose={() => setopen(false)} />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Stage Overview</h3>
          {candidatesLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {getStageStats(candidatesData?.data?.data || []).map(stage => (
                <div key={stage.name} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{stage.name}</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${stage.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{stage.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  return `${Math.floor(diffInSeconds / 86400)} days ago`
}

function getActivityColor(type: string): string {
  switch (type) {
    case 'application': return 'bg-blue-600'
    case 'assessment': return 'bg-yellow-600'
    case 'interview': return 'bg-purple-600'
    case 'success': return 'bg-green-600'
    default: return 'bg-gray-600'
  }
}

function getStageStats(candidates: Candidate[]) {
  const stages = ['applied', 'screening', 'assessment', 'interview', 'offer', 'hired']
  const total = candidates.length
  
  return stages.map(stageName => {
    const count = candidates.filter(c => c.stage === stageName).length
    const percentage = total > 0 ? (count / total) * 100 : 0
    
    return {
      name: stageName.charAt(0).toUpperCase() + stageName.slice(1),
      count,
      percentage: Math.round(percentage)
    }
  })
}