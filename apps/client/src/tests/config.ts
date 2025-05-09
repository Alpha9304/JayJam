export const TEST_CONFIG = {
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL ||'http://localhost:3002',
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_FALLBACK_URL || 'http://localhost:4002' ,
}; 