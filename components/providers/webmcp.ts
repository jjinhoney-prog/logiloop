import { flushSync } from 'react-dom';
import { COMPARE_LIMIT } from '@/lib/logic';
import type { ListingSummary } from '@/lib/types';

interface ComparisonBridge {
  getSelection: () => string[];
  /** 공개 매물 요약. 아직 받지 못했으면 빈 배열 */
  getCatalog: () => ListingSummary[];
  setSelection: (ids: string[]) => void;
  signal: AbortSignal;
}

/**
 * 실험적 WebMCP(document.modelContext)를 지원하는 브라우저에서만 비교함 도구를 등록한다.
 * 미지원 브라우저에서는 아무 동작도 하지 않는다. 상담 접수·고객 데이터는 노출하지 않는다.
 */
export function registerComparisonTools({ getSelection, getCatalog, setSelection, signal }: ComparisonBridge) {
  const modelContext = typeof document === 'undefined' ? undefined : document.modelContext;
  if (!modelContext?.registerTool) return;

  const register = (tool: ModelContextTool) => {
    try {
      Promise.resolve(modelContext.registerTool(tool, { signal })).catch(() => {});
    } catch {}
  };

  register({
    name: 'read_comparison_candidates',
    description: 'Read the public catalog summary and current browser-local comparison selection. No quotes or customer data.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: () => ({
      selectedIds: getSelection(),
      candidates: getCatalog().map(({ id, name, region, type, temperature }) => ({ id, name, region, type, temperature })),
    }),
  });

  register({
    name: 'set_comparison_candidates',
    description: 'Replace the visible browser-local comparison selection with up to three public catalog IDs. Does not submit an inquiry.',
    inputSchema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' }, maxItems: COMPARE_LIMIT, uniqueItems: true } },
      required: ['ids'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    execute: (input) => {
      const ids = (input as { ids?: unknown } | undefined)?.ids;
      if (
        !Array.isArray(ids) ||
        ids.length > COMPARE_LIMIT ||
        new Set(ids).size !== ids.length ||
        ids.some((id) => !getCatalog().some((item) => item.id === id))
      ) {
        throw new Error('Provide up to three unique catalog IDs.');
      }
      flushSync(() => setSelection([...ids]));
      return { selectedIds: [...getSelection()], savedIn: 'this browser only', inquirySubmitted: false };
    },
  });
}
