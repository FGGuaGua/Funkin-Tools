import { z } from 'zod';
export const NoteData = z.object({
  id: z.number(),
  sLen: z.number().nullish().default(0),
  time: z.number(),
  type: z.number().nullish().default(-1),
});

export const EventData = z.object({
  params: z.array(z.any()),
  time: z.number(),
  name: z.string(),
});

export const StrumLineData = z.object({
  keyCount: z.number().nullish().default(4),
  notes: z.array(NoteData).nullish(),
  visible: z.boolean().nullish().default(true),
  strumSpacing: z.number().nullish().default(1),
  strumPos: z.array(z.number()).nullish(),
  position: z.string(),
  strumScale: z.number().nullish().default(1),
  vocalsSuffix: z.string().nullish(),
  strumLinePos: z.number().nullish(),
  type: z.number(),
  characters: z.array(z.string()),
});

export const RootData = z.object({
  events: z.array(EventData).nullish(),
  strumLines: z.array(StrumLineData),
  codenameChart: z.boolean(),
  scrollSpeed: z.number(),
  chartVersion: z.string().nullish(),
  stage: z.string(),
  noteTypes: z.array(z.string()).nullish().default([]),
});

export type Root = z.infer<typeof RootData>;
export type StrumLine = z.infer<typeof StrumLineData>;
export type Note = z.infer<typeof NoteData>;