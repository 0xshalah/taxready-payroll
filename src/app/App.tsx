import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { AppRoutes } from './routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds — data refreshes more often
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
