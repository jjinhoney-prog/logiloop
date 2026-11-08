import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'tests/admin-e2e',workers:1,fullyParallel:false,
 use:{reducedMotion:'reduce',baseURL:'http://localhost:3407',trace:'retain-on-failure'},
 projects:[{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},{name:'mobile',use:{...devices['Pixel 7']}}],
 webServer:[{command:'MOCK_DB_PORT=3507 node tests/admin-e2e/mock-db.mjs',url:'http://127.0.0.1:3507',reuseExistingServer:false},{command:process.env.BENCHMARK_SKIP_BUILD==='1'?'npx next start -p 3407':'npm run build && npx next start -p 3407',url:'http://localhost:3407',reuseExistingServer:false,timeout:240000,env:{SUPABASE_URL:'http://127.0.0.1:3507',SUPABASE_SERVICE_ROLE_KEY:'test-only-key',ADMIN_PASSWORD:'test-only-password',SESSION_SECRET:'test-only-session-secret-0123456789',RESEND_API_KEY:'',INQUIRY_TO_EMAIL:'',KAKAO_REST_KEY:'',NEXT_PUBLIC_KAKAO_MAP_KEY:'',NEXT_TELEMETRY_DISABLED:'1'}}],
});
