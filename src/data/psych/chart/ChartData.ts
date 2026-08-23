import { z } from 'zod';
// 使用 z.tuple 并允许第四个可选
const SectionNoteData = z.union([
  z.tuple([z.number(), z.number(), z.number()]),
  z.tuple([z.number(), z.number(), z.number(), z.string()]),
]);
// 每个小节（section）
const SectionData = z.object({
  mustHitSection: z.boolean(),
  typeOfSection: z.number(),
  lengthInSteps: z.number(),
  sectionNotes: z.array(SectionNoteData),
});
const SongData = z.object({
  song: z.string(),
  notes: z.array(SectionData),
  bpm: z.number(),
  sections: z.number(),
  needsVoices: z.boolean(),
  player1: z.string(),
  player2: z.string(),
  sectionLengths: z.array(z.number()),
  speed: z.number(),
});
export const RootData = z.object({
  song: SongData,
  bpm: z.number(),
  sections: z.number(),
  notes: z.array(SectionData),
});


export type Root = z.infer<typeof RootData>;