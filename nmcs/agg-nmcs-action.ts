import { Apartment, Core, Entrance } from '@project-rouge/rg-core';

export type AggNmcsAction = {
  unit: (Apartment | Core | Entrance);
  rolloutWeight: number;
  /** The door position relative to the beginning of the unit */
  doorPosition: number;
  doorWidth: number;
  gia: number;
};
