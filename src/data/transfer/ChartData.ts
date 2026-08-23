import { z } from 'zod';
import { RootData as CNERoot } from '../codename/chart/ChartData';
import { MetaData as CNEMeta } from '../codename/chart/MetaData';
import { listFiles, readJsonAt } from '../../services/api'

export const MetaData = z.object({
  bpm: z.number().nullish(),
  name: z.string().nullish(),
  stage: z.string().nullish(),
  displayName: z.string().nullish(),
});

export const NoteData = z.object({
  id: z.number(),
  length: z.number().nullish().default(0),
  time: z.number(),
  type: z.number().nullish().default(-1),
});

export const StrumLineData = z.object({
  keyCount: z.number().nullish().default(4),
  position: z.string(),
  notes: z.array(NoteData).nullish().default([]),
  characters: z.string(),
});
export const ChartData = z.object({
  strumLines: z.array(StrumLineData).nullish(),
  scrollSpeed: z.number().nullish(),
});
export const RootData = z.object({
  charts: z.array(ChartData).nullish().default([]),
  diff: z.array(z.string()).nullish().default([]),
  meta: MetaData.default({stage:"stage"}),
  noteTypes: z.array(z.string()).nullish().default([]),
});
export type Root = z.infer<typeof RootData>;
export type StrumLine = z.infer<typeof StrumLineData>;
export type Note = z.infer<typeof NoteData>;
export type Meta = z.infer<typeof MetaData>;
export async function fromCNE(chartfolder:string, metafile:string): Promise<Root>
{
    var root:Root = RootData.parse({});
    const files = listFiles(chartfolder);

    for (const filename of await files) {
        console.log(filename);
        if (filename.endsWith(".json")) {
            const filePath = `${chartfolder}/${filename}`
            console.log(filePath);
            const data = await readJsonAt(filePath, CNERoot)
            const chart = ChartData.parse({
                strumLines: [],
                scrollSpeed: data?.scrollSpeed
            });
            if(root.noteTypes?.length==0)
            {
                (root.meta as Meta).stage = data?.stage;

                root.noteTypes = [];
                (data?.noteTypes ?? []).forEach(element => {
                    switch(element)
                    {
                        case "No Anim Note":
                            root.noteTypes?.push("__ALT_NOTE__")
                            break;
                        default:
                            root.noteTypes?.push(element)
                            break;
                    }
                })
            }
            data?.strumLines.forEach(element => {
                var strumlineData = StrumLineData.parse({
                    position: element.position,
                    keyCount: element.keyCount,
                    characters: element.characters[0]
                }) as StrumLine
                element.notes.forEach(note => {
                    var notedata = NoteData.parse({
                        id: note.id,
                        length: note.sLen,
                        time: note.time,
                        type: (note.type==null ? 0 : note.type) - 1,
                    })
                    strumlineData.notes?.push(notedata)
                })

                chart.strumLines?.push(strumlineData)
            });

            root.charts?.push(chart)
            root.diff?.push(filename.replace(".json",""))
        }
    }
    const metadata = await readJsonAt(metafile, CNEMeta);
    (root.meta as Meta).bpm = metadata?.bpm;
    (root.meta as Meta).name = metadata?.name;
    (root.meta as Meta).displayName = metadata?.displayName;

    console.log(root);
    return root;
}

