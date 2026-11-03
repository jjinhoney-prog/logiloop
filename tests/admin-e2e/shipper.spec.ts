import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {shipperFields,shipperCategories} from '../../lib/shipper-quote';
test('formal shipper intake is stored and imported into admin quote',async({page,request},testInfo)=>{
 await request.post(`${process.env.BENCHMARK_DB_URL || 'http://127.0.0.1:3303'}/reset`);
 await page.setExtraHTTPHeaders({'x-forwarded-for':testInfo.project.name==='mobile'?'127.0.10.2':'127.0.10.1'});
 await page.goto('/quote/request');
 await page.getByRole('button',{name:'3PL 견적 요청 접수'}).click();await expect(page.locator('.partner-page').getByRole('alert')).toHaveText('필수 조건과 수량을 확인하세요.');
 for(const [key,value] of Object.entries({company:'테스트 화주',name:'테스트 담당자',phone:'01012345678',item:'견적용 생활용품'}))await page.locator(`[name="${key}"]`).fill(value);
 await page.getByRole('checkbox',{name:'부산',exact:true}).check();await page.getByRole('checkbox',{name:'경남',exact:true}).check();await page.getByRole('checkbox',{name:'상온',exact:true}).check();await page.getByRole('checkbox',{name:'냉장',exact:true}).check();await page.getByLabel('희망 센터 지역 직접 입력').fill('항만 접근 필요');
 await page.locator('details.shipper-details').evaluateAll(elements=>elements.forEach(el=>{(el as HTMLDetailsElement).open=true;}));
 for(const [key,value] of Object.entries({category:shipperCategories[0],packaging:'박스 포장',integration:'엑셀 전달'}))await page.locator(`input[name="shipper.${key}"]`).locator('..').filter({hasText:value}).getByRole('checkbox').check();
 for(const name of ['보관','입출고','포장','택배','반품'])await page.getByRole('checkbox',{name,exact:true}).check();
 for(const [key,,type,,required] of shipperFields){if(!required&&['materialUrl','budget'].includes(key))continue;await page.locator(`[name="shipper.${key}"]`).fill(type==='number'?'10':type==='date'?'2099-01-01':type==='email'?'private@example.com':'테스트 작업 조건');}
 await page.locator('[name="shipper.budget"]').fill('월 300만원');await page.locator('[name="shipper.materialUrl"]').fill('https://example.com/product');await page.getByLabel('추가 요청 · 선택',{exact:true}).fill('합포장 동봉 작업 필요');
 await page.locator('[name="consent"]').check();await page.locator('[name="shipper.shareConsent"]').check();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect((await new AxeBuilder({page}).include('.partner-page').analyze()).violations).toEqual([]);
 await expect(page.locator('[name="company"]')).toHaveAttribute('aria-invalid','false');
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:testInfo.outputPath('shipper-request.png'),fullPage:true});
 await page.getByRole('button',{name:'3PL 견적 요청 접수'}).click();await expect(page.getByRole('heading',{name:'3PL 견적 요청을 접수했습니다'})).toBeVisible();
 await page.goto('/admin/login?next=quotes');await page.getByLabel('비밀번호').fill('test-only-password');await page.getByRole('button',{name:'로그인'}).click();await expect(page).toHaveURL('/admin/quotes');
 await page.getByLabel('화주 상담 선택').selectOption({label:'#1 테스트 화주'});
 await expect(page.getByLabel('희망 지역',{exact:true})).toHaveValue('부산 · 경남 · 항만 접근 필요');
 await expect(page.getByLabel('필요 온도',{exact:true})).toHaveValue('상온 · 냉장');
 await expect(page.getByLabel('보관 수량',{exact:true})).toHaveValue('10');await expect(page.getByLabel('포장 수량',{exact:true})).toHaveValue('10');
 const operations=await page.getByLabel('작업 조건·화주 입력 원문',{exact:true}).inputValue();for(const value of ['월 300만원','https://example.com/product','합포장 동봉 작업 필요'])expect(operations).toContain(value);expect(operations).not.toContain('private@example.com');
 await page.getByText('화주 원본 조건·회신 연락처 확인 (관리자 전용)',{exact:true}).click();await expect(page.getByText('private@example.com',{exact:true})).toBeVisible();
});

test('minimal shipper request accepts omitted details without treating quantities as zero',async({page,request},testInfo)=>{
 await request.post(`${process.env.BENCHMARK_DB_URL || 'http://127.0.0.1:3303'}/reset`);
 await page.setExtraHTTPHeaders({'x-forwarded-for':testInfo.project.name==='mobile'?'127.0.11.2':'127.0.11.1'});
 await page.goto('/quote/request');
 for(const [key,value] of Object.entries({company:'최소 입력 화주',name:'담당자',phone:'01012345678',item:'생활용품'}))await page.locator(`[name="${key}"]`).fill(value);
 await page.locator('[name="consent"]').check();await page.locator('[name="shipper.shareConsent"]').check();
 await page.getByRole('button',{name:'3PL 견적 요청 접수'}).click();await expect(page.getByRole('heading',{name:'3PL 견적 요청을 접수했습니다'})).toBeVisible();
 await page.goto('/admin/login?next=quotes');await page.getByLabel('비밀번호').fill('test-only-password');await page.getByRole('button',{name:'로그인'}).click();await expect(page).toHaveURL('/admin/quotes');
 await page.getByLabel('화주 상담 선택').selectOption({label:'#1 최소 입력 화주'});
 await expect(page.getByLabel('보관 수량',{exact:true})).toHaveValue('');await expect(page.getByLabel('포장 수량',{exact:true})).toHaveValue('');
});
