import 'server-only';
import { Resend } from 'resend';
import { setMailStatus } from './inquiries';
import { partnerSummary, type PartnerProfile } from './partner-profile';
// No access token in email, logs or admin lists. Registration remains accepted if notification fails.
export async function notifyPartnerRegistration(id: number, profile: PartnerProfile) {
  const key = process.env.RESEND_API_KEY; const to = process.env.INQUIRY_TO_EMAIL;
  let status: 'sent' | 'failed' | 'skipped' = 'skipped';
  if (key && to) {
    try {
      const result = await new Resend(key).emails.send({ from: '로지루프 <onboarding@resend.dev>', to: to.split(',').map(x => x.trim()), subject: `[로지루프 3PL 등록] ${profile.company.replace(/[\r\n]/g, ' ')} · #${id}`, text: `3PL 업체 등록이 접수되었습니다.\n접수번호: #${id}\n\n${partnerSummary(profile)}\n\n관리자 화면의 3PL 업체 탭에서 확인하세요.` });
      status = result.error ? 'failed' : 'sent';
    } catch { status = 'failed'; }
  }
  try { await setMailStatus(id, status); } catch { console.error('[partnership] notification status update failed'); }
}
