import { TypeSchemaBuilder, Resolve } from "./type-schema";

const builder = new TypeSchemaBuilder();
export const TerminalIdSchema = builder.string({ default: [{ source: 'env', name: 'TERM_ID' }, { source: 'pid' }] });
export type TerminalId = Resolve<typeof TerminalIdSchema>;
