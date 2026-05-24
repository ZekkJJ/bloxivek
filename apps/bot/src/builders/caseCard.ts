import { bloxiveContainer } from './containers.js';
import type { LawCase, Nation } from '@bloxive/shared';

export function buildCaseCard(lawCase: LawCase, nation: Nation, locale: string) {
  return bloxiveContainer([
    { type: 11, text: `Case: ${lawCase.case_number}` },
    { type: 11, text: `Status: ${lawCase.status}` }
  ]);
}
