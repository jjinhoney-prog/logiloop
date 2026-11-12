import 'server-only';
import { Resend } from 'resend';
import { setMailStatus } from './inquiries';
import { warehouseSummary, type WarehouseProfile } from './warehouse-profile';
// 메일·로그·관리자 목록에 보완 토큰을 넣지 않는다. 알림이 실패해도 접수는 유지한다.
export async function notifyWarehouseRegistration(id: number, profile: WarehouseProfile) {
  const key = process.env.RESEND_API_KEY; const to = process.env.INQUIRY_TO_EMAIL;
  let status: 'sent' | 'failed' | 'skipped' = 'skipped';
  if (key && to) {
    try {
      const subject = `[로지루프 창고 등록] ${profile.province} ${profile.district} ${profile.facilityType} · #${id}`.replace(/[\r\n]/g, ' ');
      const result = await new Resend(key).emails.send({ from: '로지루프 <onboarding@resend.dev>', to: to.split(',').map(x => x.trim()), subject, text: `창고·물류센터 임대 등록이 접수되었습니다.\n접수번호: #${id}\n\n${warehouseSummary(profile)}\n\n관리자 화면의 창고 등록 탭에서 확인하세요.` });
      status = result.error ? 'failed' : 'sent';
    } catch { status = 'failed'; }
  }
  try { await setMailStatus(id, status); } catch { console.error('[warehouse] notification status update failed'); }
}
