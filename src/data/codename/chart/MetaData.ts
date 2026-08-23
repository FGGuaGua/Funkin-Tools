import { z } from 'zod';
export const MetaData = z.object({
  name: z.string().nullish(),
  bpm: z.number().nullish(),
  variant: z.string().nullish(),
  displayName: z.string().nullish(),
  beatsPerMeasure: z.number().nullish(),
  difficulties: z.array(z.string()).nullish(),
  variants: z.array(z.string()).nullish(),
  customValues: z.any().nullish(),
  icon: z.string().nullish(),
  color: z.string().nullish(),
  coopAllowed: z.boolean().nullish(),
  opponentModeAllowed: z.boolean().nullish(),
  //metas: lazy...,
  instSuffix: z.string().nullish(),
  vocalsSuffix: z.string().nullish(),
  needsVoices: z.boolean().nullish(),
});


export type Meta = z.infer<typeof MetaData>;