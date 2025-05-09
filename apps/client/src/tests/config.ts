export const TEST_CONFIG = {
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL ||'http://localhost:3002',
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_FALLBACK_URL || 'http://localhost:4002' ,
  testEmail: 'yzhu186@jh.edu',
  testPassword: '123@Password',
  sisLink: 'https://uisdxp.sis.jhu.edu/api/course/calendar/6e9d7c0464ba4ba6a6857d56752ce370',
}; 