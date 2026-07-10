import type { ActivoParam } from '../../services/api';

export type ActivoFilterValue = 'all' | 'active' | 'inactive';

export function activoFilterToBoolean(value: ActivoFilterValue): ActivoParam {
  if (value === 'active') return true;
  if (value === 'inactive') return false;
  return 'all';
}
