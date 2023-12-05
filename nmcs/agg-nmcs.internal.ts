import { AggNmcsAction } from './agg-nmcs-action';
import { AggNmcsRulesData } from './agg-nmcs-rules-data';
import { AggNmcsState } from './agg-nmcs-state';
import { Nmcs } from './nmcs';

export type AggNmcs = Nmcs<AggNmcsState, AggNmcsAction, AggNmcsRulesData>
