import type {
  CanvasElement,
  DesignJson,
  DesignJsonElement,
  SlideDimensions,
  Variable,
} from '@/types/pptx';

/** Exporta el estado del diseño a JSON */
export function exportDesignToJson(
  dimensions: SlideDimensions,
  canvasElements: CanvasElement[],
  variables: Variable[]
): DesignJson {
  const canvasElementsJson: DesignJsonElement[] = canvasElements.map((el) => {
    const variableName =
      el.variableId != null
        ? variables.find((v) => v.id === el.variableId)?.name ?? null
        : null;
    return {
      variableName,
      type: el.type,
      label: el.label,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      style: el.style,
      keepAspectRatio: el.keepAspectRatio ?? null,
    };
  });

  return {
    version: 1,
    dimensions,
    canvasElements: canvasElementsJson,
  };
}

/** Convierte un DesignJson a CanvasElement[] con IDs nuevos y mapeo de variableName → variableId */
export function importDesignFromJson(
  data: DesignJson,
  variables: Variable[]
): { dimensions: SlideDimensions; canvasElements: CanvasElement[] } {
  const canvasElements: CanvasElement[] = data.canvasElements.map((el) => {
    const variableId =
      el.variableName != null
        ? variables.find((v) => v.name === el.variableName)?.id ?? null
        : null;

    return {
      id: crypto.randomUUID(),
      variableId,
      type: el.type,
      label: el.label,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      style: el.style,
      keepAspectRatio: el.keepAspectRatio ?? undefined,
    };
  });

  return {
    dimensions: data.dimensions,
    canvasElements,
  };
}

/** Valida que un objeto tenga la estructura básica de DesignJson */
export function isValidDesignJson(obj: unknown): obj is DesignJson {
  if (obj == null || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (typeof o.version !== 'number') return false;
  if (o.dimensions == null || typeof o.dimensions !== 'object') return false;
  const d = o.dimensions as Record<string, unknown>;
  if (typeof d.width !== 'number' || typeof d.height !== 'number') return false;
  if (!Array.isArray(o.canvasElements)) return false;
  return true;
}
