'use server';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/auth';
import { getInquiries } from '@/lib/inquiries';
import { readPartner } from '@/lib/partner-store';
import { deadlinePassed, normalizeQuoteSpec } from '@/lib/quotes';
import { insertQuotes, issueQuoteToken, patchQuote, quoteIdValid, quoteView, readQuote } from '@/lib/quote-store';
import { createReport, issueReportToken, listGroupQuotes, patchReport, readReport, reportViewFor, settingsOf } from '@/lib/quote-report-store';
import { normalizeSettings, reportStages } from '@/lib/quote-report';

export async function createQuoteRequest(groupId: string, inquiryId: number, partnerIds: number[], input: unknown) {
  await assertAdmin();
  try {
    if (!quoteIdValid(groupId) || !Number.isSafeInteger(inquiryId) || !Array.isArray(partnerIds) || partnerIds.length < 1 || partnerIds.length > 5 || partnerIds.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new Error('상담과 업체를 1~5곳 선택하세요.');
    const spec = normalizeQuoteSpec(input);
    if (deadlinePassed(spec.deadline)) throw new Error('회신기한을 오늘 이후로 지정하세요.');
    const inquiry = (await getInquiries()).find(r => r.id === inquiryId && r.kind === 'consultation');
    if (!inquiry) throw new Error('화주 상담을 찾을 수 없습니다.');
    const partners = await Promise.all([...new Set(partnerIds)].map(async id => {
      const p = await readPartner(id);
      if (!p || p.doc.stage === '보류') throw new Error('업체 정보 또는 보류 상태를 확인하세요.');
      return {id,company:p.doc.profile.company};
    }));
    await insertQuotes(groupId,inquiryId,partners,spec);
    revalidatePath('/admin/quotes');
    return {ok:true as const};
  } catch(err) { return {ok:false as const,error:err instanceof Error ? err.message : '저장하지 못했습니다.'}; }
}
export async function updateQuoteRequest(id: string, revision: string, action: 'link'|'sent'|'close', deliveryNote = '') {
  await assertAdmin();
  try {
    if (!quoteIdValid(id) || !['link','sent','close'].includes(action)) throw new Error('요청을 확인하세요.');
    const row = await readQuote(id);
    if (!row) throw new Error('견적 요청을 찾을 수 없습니다.');
    if (row.revision !== revision) throw new Error('내용이 변경되었습니다. 새로고침 후 다시 시도하세요.');
    if (action === 'link') {
      const result = await issueQuoteToken(row); revalidatePath('/admin/quotes');
      return {ok:true as const,view:result,token:result.token};
    }
    if (row.state === '종결') throw new Error('이미 종결된 요청입니다.');
    if (action === 'sent' && (row.state !== '전달 준비' || deadlinePassed(row.spec.deadline))) throw new Error('유효한 회신 링크를 먼저 발급하세요.');
    if (action === 'sent' && (typeof deliveryNote !== 'string' || !deliveryNote.trim() || deliveryNote.length > 300)) throw new Error('전달 채널과 수신 담당자를 기록하세요.');
    const updated = await patchQuote(row,action === 'close' ? {state:'종결',access_hash:null,expires_at:null} : {state:'전달 완료',sent_at:new Date().toISOString(),delivery_note:deliveryNote.trim()});
    revalidatePath('/admin/quotes'); return {ok:true as const,view:quoteView(updated)};
  } catch(err) { return {ok:false as const,error:err instanceof Error ? err.message : '변경하지 못했습니다.'}; }
}

// ── 화주용 비교 리포트 (supabase/008_quote_reports.sql) ──
async function groupContext(groupId: string) {
  if (!quoteIdValid(groupId)) throw new Error('견적 묶음을 확인하세요.');
  const quotes = await listGroupQuotes(groupId);
  if (!quotes.length) throw new Error('견적 묶음을 찾을 수 없습니다.');
  return { quotes, report: await readReport(groupId) };
}
export async function loadQuoteReport(groupId: string) {
  await assertAdmin();
  try {
    const { report } = await groupContext(groupId);
    return { ok: true as const, report: report ? { settings: settingsOf(report), revision: report.revision, issuedAt: report.issued_at, sentAt: report.sent_at, expiresAt: report.expires_at, deliveryNote: report.delivery_note, replies: report.replies } : null, view: await reportViewFor(groupId, report) };
  } catch (err) { return { ok: false as const, error: err instanceof Error ? err.message : '불러오지 못했습니다.' }; }
}
export async function saveQuoteReport(groupId: string, revision: string, input: unknown) {
  await assertAdmin();
  try {
    const { quotes, report } = await groupContext(groupId);
    const settings = normalizeSettings(input, quotes.map(q => q.id));
    if (!report) await createReport(groupId, quotes[0].inquiry_id, settings);
    else {
      if (report.revision !== revision) throw new Error('내용이 변경되었습니다. 새로고침 후 다시 시도하세요.');
      await patchReport(report, { settings, ...(settings.stage === '종결' ? { access_hash: null, expires_at: null } : {}) });
    }
    revalidatePath('/admin/quotes');
    return { ok: true as const };
  } catch (err) { return { ok: false as const, error: err instanceof Error ? err.message : '저장하지 못했습니다.' }; }
}
export async function updateQuoteReportLink(groupId: string, revision: string, action: 'link' | 'sent', deliveryNote = '') {
  await assertAdmin();
  try {
    const { report } = await groupContext(groupId);
    if (!report) throw new Error('리포트 설정을 먼저 저장하세요.');
    if (report.revision !== revision) throw new Error('내용이 변경되었습니다. 새로고침 후 다시 시도하세요.');
    if (settingsOf(report).stage === '종결') throw new Error('종결된 리포트입니다.');
    if (action === 'link') { const { token } = await issueReportToken(report); revalidatePath('/admin/quotes'); return { ok: true as const, token }; }
    if (!report.access_hash || !report.expires_at || report.expires_at <= Date.now()) throw new Error('유효한 리포트 링크를 먼저 발급하세요.');
    if (typeof deliveryNote !== 'string' || !deliveryNote.trim() || deliveryNote.length > 300) throw new Error('전달 채널과 수신 담당자를 기록하세요.');
    const settings = settingsOf(report);
    await patchReport(report, { sent_at: new Date().toISOString(), delivery_note: deliveryNote.trim(), settings: { ...settings, stage: reportStages.indexOf(settings.stage) < reportStages.indexOf('리포트 발송') ? '리포트 발송' : settings.stage } });
    revalidatePath('/admin/quotes');
    return { ok: true as const };
  } catch (err) { return { ok: false as const, error: err instanceof Error ? err.message : '처리하지 못했습니다.' }; }
}
