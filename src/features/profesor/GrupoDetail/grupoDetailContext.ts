import type { Clase, Grupo } from '../../../types';

export interface GrupoDetailContext {
  grupo: Grupo;
  clases: Clase[];
}
