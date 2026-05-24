import { bloxiveContainer } from './containers.js';
import type { Citizen, Nation } from '@bloxive/shared';

export function buildDniCard(imageUrl: string, citizen: Citizen, nation: Nation) {
  return bloxiveContainer([
    { type: 11, text: `DNI for ${citizen.citizen_number}` },
    { type: 13, url: imageUrl } // MediaGallery
  ]);
}
