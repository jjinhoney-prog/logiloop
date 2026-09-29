import { flushSync } from 'react-dom';
import { listings } from '@/lib/data';
import { COMPARE_LIMIT } from '@/lib/logic';

interface ComparisonBridge {
  getSelection: () => string[];
  setSelection: (ids: string[]) => void;
  signal: AbortSignal;
}

/**
 * 실험적 WebMCP(document.modelContext)를 지원하는 브라우저에서만 비교함 도구를 등록한다.
 * 미지원 브라우저에서는 아무 동작도 하지 않는다. 상담 접수·고객 데이터는 노출하지 않는다.
 */
export function registerComparisonTools({ getSelection, setSelection, signal }: ComparisonBridge) {
  const modelContext = typeof document === 'undefined' ? undefined : document.modelContext;
  if (!modelContext?.registerTool) return;

  const register = (tool: ModelContextTool) => {
    try {
      Promise.resolve(modelContext.registerTool(tool, { signal })).catch(() => {});
    } catch {}
  };

  register({
    name: 'read_comparison_candidates',
    description: 'Read the fictional catalog and current browser-local comparison selection. No quotes or customer data.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: () => ({
      exampleData: true,
      selectedIds: getSelection(),
      candidates: listings.map(({ id, name, region, type, temperature }) => ({ id, name, region, type, temperature })),
    }),
  });

  register({
    name: 'set_comparison_candidates',
    description: 'Replace the visible browser-local comparison selection with up to three fictional catalog IDs. Does not submit an inquiry.',
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
        ids.some((id) => !listings.some((item) => item.id === id))
      ) {
        throw new Error('Provide up to three unique catalog IDs.');
      }
      flushSync(() => setSelection([...ids]));
      return { selectedIds: [...getSelection()], savedIn: 'this browser only', inquirySubmitted: false };
    },
  });
}
