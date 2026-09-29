// Experimental WebMCP surface (document.modelContext). Only the members this app uses are declared.
interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
  execute: (input: unknown) => unknown;
}

interface ModelContext {
  registerTool(tool: ModelContextTool, options?: { signal?: AbortSignal }): unknown;
}

interface Document {
  readonly modelContext?: ModelContext;
}
