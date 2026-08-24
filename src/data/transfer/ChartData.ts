import { z } from 'zod';
import { listFiles, readJsonAt } from '../../services/api'

import { RootData as CNERoot, Note as CNENote } from '../codename/chart/ChartData';
import { MetaData as CNEMeta } from '../codename/chart/MetaData';

import { Root as PsychRootType,
         RootData as PsychRoot,
         NoteData as PENoteData,
         Note as PsychNote       } from '../psych/chart/ChartData';
import { PsychZipData, PsychZip  } from './ZipFileData';


export const MetaData = z.object({
  bpm: z.number().nullish(),
  name: z.string().nullish(),
  stage: z.string().nullish(),
  displayName: z.string().nullish(),
  needVoice: z.boolean().nullish(),
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
  notes: z.array(NoteData),
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
  noteTypes: z.array(z.string()).default([]),
});
export type Root = z.infer<typeof RootData>;
export type StrumLine = z.infer<typeof StrumLineData>;
export type Chart = z.infer<typeof ChartData>;
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
                    characters: element.characters[0],
                    notes: [],
                }) as StrumLine
                (element.notes as CNENote[]).forEach(note => {
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
    return root;
}

export async function toPsych(root:Root,newVer:Boolean = false): Promise<PsychZip>
{
    var zipData = PsychZipData.parse({
        song: root.meta.name ?? root.meta.displayName ?? "unknown",
        chart: [],
        diff: [],
    })
    for (let i: number = (root.diff?.length as number) - 1; i >= 0; i--)
    {
        var curChart = (root.charts as Chart[])[i]
        var result:PsychRootType = PsychRoot.parse({
            song: {
                bpm: root.meta.bpm,
                song: root.meta.displayName ?? root.meta.name ?? "unknown",
                needsVoices: root.meta.needVoice ?? true,
                speed: curChart.scrollSpeed ?? 1,
                stage: root.meta.stage,
                notes: []
            }
        });
        var maxSection = 0;
        var maxNoteTime = 0;
        var minNoteTime = 0;
        maxSection = (60/result.song.bpm)*4*1000 - 1;
        curChart.strumLines?.forEach(sL => {
            switch(sL.position)
            {
                case "dad":
                    result.song.player2 = sL.characters
                    break;
                case "girlfriend":
                    result.song.gfVersion = sL.characters
                    break;
                case "boyfriend":
                    result.song.player1 = sL.characters
                    break;
            }
        })
        //获取第一个箭头的小节数
        curChart.strumLines?.forEach(sL => {
            sL.notes.forEach(note => {
                if (note.time > maxNoteTime)
                    maxNoteTime = note.time
            })
        })
	    minNoteTime = maxNoteTime
        curChart.strumLines?.forEach(sL => {
            sL.notes.forEach(note => {
                if (note.time <= minNoteTime)
                    minNoteTime = note.time
            })
        })
        var notes:PsychNote[] = [];
        curChart.strumLines?.forEach(sL => {
            sL.notes.forEach(note => {
                var notedata = PENoteData.parse([note.time,note.id,note.length]);
                if (sL.position == "boyfriend")notedata[1] += 4
                var noteType = note.type ?? -1

                if (noteType >= 0)
                {
                    switch(root.noteTypes[noteType])
                    {
                        case "__ALT_NOTE__":
                            notedata[3] = "Alt Animation"
                            break;
                        default:
                            notedata[3] = root.noteTypes[noteType]
                            break;
                    }
                }

                if (sL.position == "girlfriend")
                    notedata[3] = "GF Sing"
                else if (sL.position != "girlfriend" && sL.position != "dad" && sL.position != "boyfriend")
                    notedata[3] = sL.position+" Sing";
                notes.push(notedata)
            })
        })
        notes.sort(function(a:PsychNote, b:PsychNote){return a[0] - b[0]})
        const lastSection = Math.floor(maxNoteTime / maxSection)
        for (let s = 0; s <= lastSection; s++)
        {
            result.song.notes.push({
            "lengthInSteps": 16,
            "mustHitSection": false,
            "sectionNotes": []
            })
        }

        notes.forEach(note => {
            const idx = Math.min(Math.floor(note[0] / maxSection), lastSection)
            result.song.notes[idx].sectionNotes.push(note)
        })
        zipData.chart?.push(result)
        zipData.diff?.push((root.diff as string[])[i])
    }
    

    return zipData;
}