import { readFile } from 'node:fs/promises';
import { parseFunnelLog, summarizeFunnel } from '../lib/funnel-report.ts';

const [file, fromArg, toArg] = process.argv.slice(2);
if (!file) throw new Error('Usage: node --experimental-strip-types scripts/report-funnel.mts <log.jsonl> [from ISO] [to ISO]');
const from = fromArg ? Date.parse(fromArg) : -Infinity;
const to = toArg ? Date.parse(toArg) : Infinity;
if (Number.isNaN(from) || Number.isNaN(to) || from >= to) throw new Error('기간은 시작보다 종료가 늦은 ISO 날짜로 입력하세요.');
const rows = (await readFile(file, 'utf8')).split('\n').map(parseFunnelLog).filter((row) => row !== null);
console.log(JSON.stringify(summarizeFunnel(rows, from, to), null, 2));
