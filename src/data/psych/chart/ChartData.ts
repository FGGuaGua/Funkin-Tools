import { z } from 'zod';
// 使用 z.tuple 并允许第四个可选
export const NoteData = z.union([
  z.tuple([z.number(), z.number(), z.number()]),
  z.tuple([z.number(), z.number(), z.number(), z.string()]),
]);
// 每个小节（section）
const SectionData = z.object({
  mustHitSection: z.boolean(),
  lengthInSteps: z.number(),
  sectionNotes: z.array(NoteData),
});
const SongData = z.object({
  song: z.string(),
  stage: z.string(),
  notes: z.array(SectionData),
  bpm: z.number(),
  needsVoices: z.boolean().nullish().default(true),
  player1: z.string().nullish().default("bf"),
  gfVersion: z.string().nullish().default("bf"),
  player2: z.string().nullish().default("bf"),
  speed: z.number().nullish().default(1),
});
export const RootData = z.object({
  song: SongData
});

export type NewRoot = z.infer<typeof SongData>;
export type Root = z.infer<typeof RootData>;
export type Note = z.infer<typeof NoteData>;