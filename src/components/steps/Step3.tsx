import { useState, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { CanvasElement, Variable, DEFAULT_TEXT_STYLE, TextStyle, TextAlign } from '@/types/pptx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft, ChevronRight, Type, Image as ImageIcon,
  Plus, Trash2, AlignLeft, AlignCenter, AlignRight, Bold, Italic,
  Move, Download, Upload
} from 'lucide-react';
import { exportDesignToJson, importDesignFromJson, isValidDesignJson } from '@/lib/designJson';
import { getSnapPoints, applySnapPosition } from '@/lib/snap';
import { cn } from '@/lib/utils';

// Canvas pixel dimensions for display
const CANVAS_PX = 900;
const SNAP_THRESHOLD_CM = 0.3;

export const Step3 = () => {
  const {
    dimensions, backgroundImage, variables, uploadedImages, excelData,
    canvasElements, addCanvasElement, updateCanvasElement, removeCanvasElement,
    setCanvasElements, setDimensions, setCurrentStep,
  } = useApp();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [draggingFromPanel, setDraggingFromPanel] = useState<string | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapGuide, setSnapGuide] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Scale factor: canvas pixels per cm
  const scale = CANVAS_PX / dimensions.width;
  const canvasHeightPx = dimensions.height * scale;

  const selectedEl = canvasElements.find(e => e.id === selectedId) ?? null;

  // Convert px offset inside canvas to cm
  const pxToCm = useCallback((px: number) => px / scale, [scale]);
  const cmToPx = useCallback((cm: number) => cm * scale, [scale]);

  // ── Drag from panel ──────────────────────────────────────────────
  const handlePanelDragStart = (e: React.DragEvent, variable: Variable) => {
    setDraggingFromPanel(variable.id);
    e.dataTransfer.setData('variableId', variable.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleStaticDragStart = (e: React.DragEvent) => {
    setDraggingFromPanel('__static__');
    e.dataTransfer.setData('variableId', '__static__');
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;
    const x = Math.max(0, pxToCm(xPx));
    const y = Math.max(0, pxToCm(yPx));

    const varId = e.dataTransfer.getData('variableId');

    if (varId === '__static__') {
      const el: CanvasElement = {
        id: crypto.randomUUID(),
        variableId: null,
        type: 'static',
        label: 'Texto estático',
        x, y,
        width: 6, height: 1.2,
        style: { ...DEFAULT_TEXT_STYLE },
      };
      addCanvasElement(el);
      setSelectedId(el.id);
    } else {
      const variable = variables.find(v => v.id === varId);
      if (!variable) return;
      const el: CanvasElement = {
        id: crypto.randomUUID(),
        variableId: variable.id,
        type: variable.type,
        label: `{${variable.name}}`,
        x, y,
        width: variable.type === 'image' ? 5 : 8,
        height: variable.type === 'image' ? 5 : 1.2,
        style: variable.type === 'text' ? { ...DEFAULT_TEXT_STYLE } : undefined,
        keepAspectRatio: variable.type === 'image',
      };
      addCanvasElement(el);
      setSelectedId(el.id);
    }
    setDraggingFromPanel(null);
  };

  // ── Drag canvas elements (con snapping) ───────────────────────────
  const draggingElRef = useRef<{ id: string; startX: number; startY: number; elX: number; elY: number; elW: number; elH: number } | null>(null);

  const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    const el = canvasElements.find(c => c.id === id);
    if (!el || !canvasRef.current) return;
    draggingElRef.current = {
      id, startX: e.clientX, startY: e.clientY,
      elX: el.x, elY: el.y, elW: el.width, elH: el.height,
    };

    const onMove = (ev: MouseEvent) => {
      if (!draggingElRef.current) return;
      const { elX, elY, elW, elH } = draggingElRef.current;
      let newX = Math.max(0, elX + pxToCm(ev.clientX - draggingElRef.current.startX));
      let newY = Math.max(0, elY + pxToCm(ev.clientY - draggingElRef.current.startY));
      newX = Math.min(dimensions.width - elW, newX);
      newY = Math.min(dimensions.height - elH, newY);

      if (snapEnabled) {
        const points = getSnapPoints(canvasElements, dimensions, id);
        const result = applySnapPosition(newX, newY, points, SNAP_THRESHOLD_CM);
        newX = result.x;
        newY = result.y;
        setSnapGuide({ x: result.snapX, y: result.snapY });
      } else {
        setSnapGuide({ x: null, y: null });
      }

      updateCanvasElement(id, { x: newX, y: newY });
    };
    const onUp = () => {
      draggingElRef.current = null;
      setSnapGuide({ x: null, y: null });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Resize handles (con snapping en esquinas) ──────────────────────
  const handleResizeMouseDown = (e: React.MouseEvent, id: string, corner: string) => {
    e.stopPropagation();
    const el = canvasElements.find(c => c.id === id);
    if (!el) return;
    const startX = e.clientX, startY = e.clientY;
    const startW = el.width, startH = el.height;
    const startElX = el.x, startElY = el.y;

    const onMove = (ev: MouseEvent) => {
      const dw = pxToCm(ev.clientX - startX);
      const dh = pxToCm(ev.clientY - startY);
      let newW = Math.max(1, startW + (corner.includes('e') ? dw : -dw));
      let newH = Math.max(0.5, startH + (corner.includes('s') ? dh : -dh));
      if (el.keepAspectRatio) {
        const ratio = startW / startH;
        newH = newW / ratio;
      }
      let newX = startElX;
      let newY = startElY;
      if (corner.includes('w')) newX = startElX + startW - newW;
      if (corner.includes('n')) newY = startElY + startH - newH;
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);
      newW = Math.max(1, newW);
      newH = Math.max(0.5, newH);

      if (snapEnabled) {
        const points = getSnapPoints(canvasElements, dimensions, id);
        const movingLeft = corner.includes('w');
        const movingTop = corner.includes('n');
        const edgeX = movingLeft ? newX : newX + newW;
        const edgeY = movingTop ? newY : newY + newH;
        const result = applySnapPosition(edgeX, edgeY, points, SNAP_THRESHOLD_CM);
        if (result.snapX != null) {
          if (movingLeft) newX = result.snapX;
          else newW = Math.max(1, result.snapX - newX);
        }
        if (result.snapY != null) {
          if (movingTop) newY = result.snapY;
          else newH = Math.max(0.5, result.snapY - newY);
        }
        setSnapGuide({ x: result.snapX, y: result.snapY });
      } else {
        setSnapGuide({ x: null, y: null });
      }

      updateCanvasElement(id, { x: newX, y: newY, width: newW, height: newH });
    };
    const onUp = () => {
      setSnapGuide({ x: null, y: null });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Get preview image for image-type element
  const getPreviewImage = (el: CanvasElement) => {
    if (el.type !== 'image') return null;
    const variable = variables.find(v => v.id === el.variableId);
    if (!variable) return null;
    const firstValue = excelData[0]?.[variable.name];
    return firstValue ? uploadedImages[firstValue] ?? null : null;
  };

  const FONTS = ['Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Courier New', 'Verdana', 'Calibri'];

  // ── Export / Import diseño JSON ───────────────────────────────────────
  const handleExportDesign = () => {
    const json = exportDesignToJson(dimensions, canvasElements, variables);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diseno_presentacion.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDesign = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setImportError(null);
    if (!file) return;
    if (variables.length === 0) {
      setImportError('Completa el paso 2 (Datos Excel) antes de importar un diseño.');
      return;
    }
    file.text().then((text) => {
      try {
        const obj = JSON.parse(text);
        if (!isValidDesignJson(obj)) {
          setImportError('El archivo JSON no tiene un formato válido de diseño.');
          return;
        }
        const { dimensions: d, canvasElements: els } = importDesignFromJson(obj, variables);
        setDimensions(d);
        setCanvasElements(els);
        setSelectedId(null);
      } catch {
        setImportError('Error al leer el archivo JSON.');
      }
    }).catch(() => setImportError('Error al leer el archivo.'));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4" style={{ minHeight: `${canvasHeightPx + 40}px` }}>
        {/* Left panel: variables (scroll independiente) */}
        <div className="w-56 shrink-0 flex flex-col gap-3 min-h-0 max-h-[calc(100vh-10rem)]">
          <h3 className="text-sm font-semibold text-foreground shrink-0">Variables</h3>
          <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
            <div className="flex flex-col gap-2 pr-1">
              {variables.map(v => (
                <div
                  key={v.id}
                  draggable
                  onDragStart={e => handlePanelDragStart(e, v)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-grab active:cursor-grabbing select-none transition-colors',
                    'bg-card border-border hover:border-primary/50 hover:bg-accent'
                  )}
                >
                  {v.type === 'image'
                    ? <ImageIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                    : <Type className="w-4 h-4 shrink-0 text-muted-foreground" />}
                  <span className="truncate text-foreground">{v.name}</span>
                  <Move className="w-3 h-3 ml-auto shrink-0 text-muted-foreground/50" />
                </div>
              ))}
              <div
                draggable
                onDragStart={handleStaticDragStart}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-grab active:cursor-grabbing select-none bg-muted border-dashed border-border hover:border-primary/50 transition-colors"
              >
                <Plus className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Texto estático</span>
                <Move className="w-3 h-3 ml-auto shrink-0 text-muted-foreground/50" />
              </div>
            </div>
          </ScrollArea>

          <div className="space-y-2 pt-2 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground">Diseño JSON</h3>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="gap-2 w-full" onClick={handleExportDesign} disabled={canvasElements.length === 0}>
                <Download className="w-4 h-4" /> Exportar diseño
              </Button>
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  onChange={handleImportDesign}
                />
                <span className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground">
                  <Upload className="w-4 h-4" /> Importar diseño
                </span>
              </label>
            </div>
            {importError && (
              <p className="text-xs text-destructive">{importError}</p>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-center gap-4">
            <span className="text-xs text-muted-foreground">
              Canvas — {dimensions.width} × {dimensions.height} cm
            </span>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={snapEnabled}
                onChange={(e) => setSnapEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-muted-foreground">Snapping</span>
            </label>
          </div>
          <div
            ref={canvasRef}
            className="relative border border-border rounded-lg overflow-hidden select-none"
            style={{ width: CANVAS_PX, height: canvasHeightPx, flexShrink: 0 }}
            onDragOver={e => e.preventDefault()}
            onDrop={handleCanvasDrop}
            onClick={() => setSelectedId(null)}
          >
            {/* Background */}
            {backgroundImage && (
              <img
                src={backgroundImage}
                alt="Fondo"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )}

            {/* Elements */}
            {canvasElements.map(el => {
              const isSelected = el.id === selectedId;
              const previewImg = getPreviewImage(el);

              return (
                <div
                  key={el.id}
                  onMouseDown={e => handleElementMouseDown(e, el.id)}
                  onClick={e => e.stopPropagation()}
                  className={cn(
                    'absolute cursor-move',
                    isSelected && 'outline outline-2 outline-primary outline-offset-1'
                  )}
                  style={{
                    left: cmToPx(el.x),
                    top: cmToPx(el.y),
                    width: cmToPx(el.width),
                    height: cmToPx(el.height),
                  }}
                >
                  {el.type === 'image' ? (
                    previewImg ? (
                      <img src={previewImg} alt={el.label} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-muted/60 border border-dashed border-border flex items-center justify-center rounded">
                        <span className="text-xs text-muted-foreground text-center px-1 truncate">{el.label}</span>
                      </div>
                    )
                  ) : (
                    <div
                      className="w-full h-full flex items-center overflow-hidden rounded px-1"
                      style={{
                        fontFamily: el.style?.fontFamily,
                        fontSize: (el.style?.fontSize ?? 18) * (scale / 28.35),
                        color: el.style?.color,
                        textAlign: el.style?.align ?? 'left',
                        fontWeight: el.style?.bold ? 'bold' : 'normal',
                        fontStyle: el.style?.italic ? 'italic' : 'normal',
                        backgroundColor: isSelected ? 'hsl(var(--primary)/0.08)' : 'transparent',
                      }}
                    >
                      {el.type === 'static' ? (
                        <span className="block w-full min-w-0 whitespace-pre-wrap break-words" style={{ textAlign: el.style?.align ?? 'left' }}>{el.label}</span>
                      ) : (
                        <span className="block w-full min-w-0 opacity-75 whitespace-nowrap overflow-hidden text-ellipsis" style={{ textAlign: el.style?.align ?? 'left' }}>
                          {el.label}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Resize handles */}
                  {isSelected && ['se', 'sw', 'ne', 'nw'].map(corner => (
                    <div
                      key={corner}
                      onMouseDown={e => handleResizeMouseDown(e, el.id, corner)}
                      className="absolute w-3 h-3 bg-primary border-2 border-background rounded-sm cursor-nwse-resize"
                      style={{
                        right: corner.includes('e') ? -6 : undefined,
                        left: corner.includes('w') ? -6 : undefined,
                        bottom: corner.includes('s') ? -6 : undefined,
                        top: corner.includes('n') ? -6 : undefined,
                        cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize',
                      }}
                    />
                  ))}
                </div>
              );
            })}

            {/* Guías de snap */}
            {snapGuide.x != null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-10"
                style={{ left: cmToPx(snapGuide.x) }}
              />
            )}
            {snapGuide.y != null && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-primary pointer-events-none z-10"
                style={{ top: cmToPx(snapGuide.y) }}
              />
            )}

            {/* Empty state */}
            {canvasElements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center bg-background/70 rounded-xl px-6 py-4">
                  <p className="text-muted-foreground text-sm">Arrastra variables al canvas para posicionarlas</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel: properties */}
        <div className="w-64 shrink-0">
          <h3 className="text-sm font-semibold text-foreground mb-3">Propiedades</h3>
          {selectedEl ? (
            <div className="space-y-4">
              {/* Position & size */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Posición y tamaño</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'X (cm)', key: 'x' },
                    { label: 'Y (cm)', key: 'y' },
                    { label: 'Ancho (cm)', key: 'width' },
                    { label: 'Alto (cm)', key: 'height' },
                  ].map(({ label, key }) => (
                    <div key={key} className="space-y-0.5">
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={Number((selectedEl as unknown as Record<string, number>)[key]).toFixed(1)}
                        onChange={e => updateCanvasElement(selectedEl.id, { [key]: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Static text content */}
              {selectedEl.type === 'static' && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Texto</Label>
                  <textarea
                    value={selectedEl.label}
                    onChange={e => updateCanvasElement(selectedEl.id, { label: e.target.value })}
                    className="w-full h-20 px-2 py-1.5 text-sm rounded-md border border-input bg-background resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              )}

              {/* Text styles */}
              {(selectedEl.type === 'text' || selectedEl.type === 'static') && selectedEl.style && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipografía</p>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fuente</Label>
                    <select
                      value={selectedEl.style.fontFamily}
                      onChange={e => updateCanvasElement(selectedEl.id, { style: { ...selectedEl.style!, fontFamily: e.target.value } })}
                      className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background focus-visible:outline-none"
                    >
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">Tamaño (pt)</Label>
                      <Input
                        type="number"
                        min="4"
                        max="200"
                        value={selectedEl.style.fontSize}
                        onChange={e => updateCanvasElement(selectedEl.id, { style: { ...selectedEl.style!, fontSize: parseInt(e.target.value) || 12 } })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">Color</Label>
                      <input
                        type="color"
                        value={selectedEl.style.color}
                        onChange={e => updateCanvasElement(selectedEl.id, { style: { ...selectedEl.style!, color: e.target.value } })}
                        className="h-8 w-full rounded-md border border-input cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as TextAlign[]).map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          const prev = selectedEl.style ?? { ...DEFAULT_TEXT_STYLE };
                          updateCanvasElement(selectedEl.id, { style: { ...prev, align: a } });
                        }}
                        className={cn(
                          'flex-1 h-8 rounded-md border flex items-center justify-center transition-colors',
                          (selectedEl.style?.align ?? 'left') === a
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {a === 'left' && <AlignLeft className="w-4 h-4" />}
                        {a === 'center' && <AlignCenter className="w-4 h-4" />}
                        {a === 'right' && <AlignRight className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateCanvasElement(selectedEl.id, { style: { ...selectedEl.style!, bold: !selectedEl.style!.bold } })}
                      className={cn(
                        'flex-1 h-8 rounded-md border flex items-center justify-center gap-1 text-sm transition-colors',
                        selectedEl.style.bold
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Bold className="w-4 h-4" /> Negrita
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCanvasElement(selectedEl.id, { style: { ...selectedEl.style!, italic: !selectedEl.style!.italic } })}
                      className={cn(
                        'flex-1 h-8 rounded-md border flex items-center justify-center gap-1 text-sm transition-colors',
                        selectedEl.style.italic
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Italic className="w-4 h-4" /> Cursiva
                    </button>
                  </div>
                </div>
              )}

              {/* Image options */}
              {selectedEl.type === 'image' && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Imagen</p>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEl.keepAspectRatio ?? true}
                      onChange={e => updateCanvasElement(selectedEl.id, { keepAspectRatio: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-foreground">Mantener proporción</span>
                  </label>
                </div>
              )}

              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2"
                onClick={() => { removeCanvasElement(selectedEl.id); setSelectedId(null); }}
              >
                <Trash2 className="w-4 h-4" /> Eliminar elemento
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-4 text-center">
              Selecciona un elemento del canvas para editar sus propiedades
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Atrás
        </Button>
        <Button onClick={() => setCurrentStep(4)} disabled={canvasElements.length === 0} className="gap-2">
          Siguiente: Generar PPTX <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
