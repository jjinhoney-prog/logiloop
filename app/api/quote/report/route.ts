import { partnerBody, partnerJson } from '@/lib/partner-http';
import { quoteIdValid } from '@/lib/quote-store';
import { canReadReport, patchReport, readReport, ReportConflict, reportViewFor, settingsOf } from '@/lib/quote-report-store';
import { normalizeReply, reportStages } from '@/lib/quote-report';

/** 화주 전용 비교 리포트. 링크 fragment의 접근키를 본문으로 받는다. */
export async function POST(request: Request) {
  const parsed = await partnerBody(request, 'quote');
  if (parsed.response) return parsed.response;
  const body = parsed.body!;
  if (!quoteIdValid(body.id) || typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) return partnerJson({ error: '유효한 리포트 링크가 아닙니다.' }, 401);
  if (!['load', 'reply'].includes(String(body.action))) return partnerJson({ error: '요청을 확인하세요.' }, 400);
  try {
    const report = await readReport(body.id);
    if (!report || !canReadReport(report, body.token)) return partnerJson({ error: '링크가 만료·종결되었거나 아직 전달 처리되지 않았습니다. 지음 담당자에게 확인해 주세요.' }, 401);
    if (body.action === 'reply') {
      const view = await reportViewFor(body.id, report);
      let reply;
      try { reply = normalizeReply(body.reply, view.rows.map(r => r.id)); }
      catch (err) { return partnerJson({ error: err instanceof Error ? err.message : '입력을 확인하세요.' }, 400); }
      if (report.replies.length >= 20) return partnerJson({ error: '응답 기록이 많습니다. 담당자에게 직접 연락해 주세요.' }, 429);
      const settings = settingsOf(report);
      const next = reply.choice === '현장 확인 요청' ? '현장 확인' : '화주 검토';
      const stage = reportStages.indexOf(settings.stage) < reportStages.indexOf(next) ? next : settings.stage;
      const saved = await patchReport(report, { replies: [...report.replies, reply], settings: { ...settings, stage } });
      return partnerJson({ ok: true, view: await reportViewFor(body.id, saved) });
    }
    return partnerJson({ ok: true, view: await reportViewFor(body.id, report) });
  } catch (err) { return partnerJson({ error: err instanceof ReportConflict ? err.message : '조회 또는 저장에 실패했습니다.' }, err instanceof ReportConflict ? 409 : 502); }
}
