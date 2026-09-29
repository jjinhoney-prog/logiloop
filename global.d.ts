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

// Kakao Maps JavaScript SDK — only the members this app uses.
declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
  }
  class LatLngBounds {
    extend(latlng: LatLng): void;
  }
  class Map {
    constructor(container: HTMLElement, options: { center: LatLng; level: number });
    setBounds(bounds: LatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
    relayout(): void;
  }
  class Marker {
    constructor(options: { position: LatLng; map?: Map; title?: string });
  }
  class CustomOverlay {
    constructor(options: { position: LatLng; content: HTMLElement | string; map?: Map; yAnchor?: number; xAnchor?: number });
  }
  function load(callback: () => void): void;
}

interface Window {
  kakao?: typeof kakao;
}
