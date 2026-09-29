import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 3200);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    // 테스트에서 외부 API를 실제로 호출하지 않도록 키를 비운다.
    // (@next/env는 이미 설정된 process.env 값을 .env.local보다 우선한다.)
    env: { RESEND_API_KEY: '', INQUIRY_TO_EMAIL: '', KAKAO_REST_KEY: '', NEXT_PUBLIC_KAKAO_MAP_KEY: '', NEXT_TELEMETRY_DISABLED: '1' },
  },
});
