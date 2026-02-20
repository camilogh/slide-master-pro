import type { CanvasElement } from '@/types/pptx';
import { cn } from '@/lib/utils';

export const CANVAS_PX = 900;

interface CanvasElementViewProps {
  el: CanvasElement;
  textContent: string;
  imageData: string | null;
  scale: number;
  cmToPx: (cm: number) => number;
  isSelected?: boolean;
  isEditor?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  renderResizeHandles?: (el: CanvasElement) => React.ReactNode;
}

/**
 * Renderiza un CanvasElement con la misma lógica que el editor (Paso 3).
 * Usado tanto en el editor como en SlidePreview para garantizar consistencia.
 */
export function CanvasElementView({
  el,
  textContent,
  imageData,
  scale,
  cmToPx,
  isSelected = false,
  isEditor = false,
  onMouseDown,
  onClick,
  renderResizeHandles,
}: CanvasElementViewProps) {
  const textAlign = el.style?.align ?? 'left';
  const justifyContent = textAlign === 'left' ? 'flex-start' : textAlign === 'center' ? 'center' : 'flex-end';
  const fontSize = (el.style?.fontSize ?? 18) * (scale / 28.35);

  return (
    <div
      onMouseDown={isEditor ? onMouseDown : undefined}
      onClick={isEditor ? onClick : undefined}
      className={cn(
        'absolute',
        isEditor && 'cursor-move',
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
        imageData ? (
          <img src={imageData} alt={el.label} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-muted/60 border border-dashed border-border flex items-center justify-center rounded">
            <span className="text-xs text-muted-foreground text-center px-1 truncate">{el.label}</span>
          </div>
        )
      ) : (
        <div
          className="w-full h-full flex items-start overflow-hidden rounded px-1 box-border"
          style={{
            fontFamily: el.style?.fontFamily ?? 'Arial',
            fontSize,
            color: el.style?.color ?? '#000000',
            textAlign,
            justifyContent,
            fontWeight: el.style?.bold ? 'bold' : 'normal',
            fontStyle: el.style?.italic ? 'italic' : 'normal',
            backgroundColor: isSelected ? 'hsl(var(--primary)/0.08)' : 'transparent',
          }}
        >
          {el.type === 'static' ? (
            <span
              className="block w-full min-w-0 whitespace-pre-wrap break-words overflow-hidden"
              style={{ textAlign }}
            >
              {textContent}
            </span>
          ) : (
            <span
              className={cn(
                'block w-full min-w-0 overflow-hidden',
                isEditor ? 'opacity-75 whitespace-nowrap text-ellipsis' : 'whitespace-pre-wrap break-words'
              )}
              style={{ textAlign }}
            >
              {textContent}
            </span>
          )}
        </div>
      )}

      {isEditor && isSelected && renderResizeHandles?.(el)}
    </div>
  );
}
