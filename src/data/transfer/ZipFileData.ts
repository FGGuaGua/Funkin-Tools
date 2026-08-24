import { z } from 'zod';
import { RootData as PsychRoot } from '../psych/chart/ChartData';
export const PsychZipData = z.object({
  chart: z.array(PsychRoot).nullish(),
  diff: z.array(z.string()).nullish(),
  song: z.string(),

  //events: z.boolean().nullish(),
});
export type PsychZip = z.infer<typeof PsychZipData>;
