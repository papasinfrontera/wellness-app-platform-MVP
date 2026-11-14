import { z } from "zod";
export const observationSchema=z.object({
 indicatorCode:z.string().min(1),value:z.number().finite(),unit:z.string().min(1),
 observedAt:z.string().datetime({offset:true}),sourceDocumentId:z.string().uuid().optional(),
 origin:z.enum(["laboratory","wearable","calculated","manual"]),
 status:z.enum(["pending_review","approved","rejected"]).default("pending_review")
});
export type ObservationInput=z.infer<typeof observationSchema>;
export const evidenceSourceSchema=z.object({
 title:z.string().min(1),sourceUrl:z.string().url().optional(),doi:z.string().optional(),
 version:z.string().optional(),scientificStatus:z.enum(["candidate","under_review","approved","superseded"]).default("candidate")
});
export const whoopRecordSchema=z.object({
 sourceId:z.string().min(1),type:z.enum(["cycle","sleep","recovery","workout","journal"]),
 startedAt:z.string().datetime({offset:true}).optional(),endedAt:z.string().datetime({offset:true}).optional(),
 payload:z.record(z.string(),z.unknown())
});
