import { forwardRef } from 'react';
import type { CanvasElement, Variable, SlideDimensions } from '@/types/pptx';
import { CanvasElementView, CANVAS_PX } from '@/components/CanvasElementView';

interface SlidePreviewProps {
  dimensions: SlideDimensions;
  backgroundImage: string | null;
  canvasElements: CanvasElement[];
  variables: Variable[];
  rowData: Record<string, string>;
  uploadedImages: Record<string, string>;
}

/** Renderiza el slide con la misma lógica que el editor (Paso 3) para captura con html2canvas */
export const SlidePreview = forwardRef<HTMLDivElement, SlidePreviewProps>(
  ({ dimensions, backgroundImage, canvasElements, variables, rowData, uploadedImages }, ref) => {
    const scale = CANVAS_PX / dimensions.width;
    const canvasHeightPx = dimensions.height * scale;
    const cmToPx = (cm: number) => cm * scale;

    return (
      <div
        ref={ref}
        className="bg-white"
        style={{
          width: CANVAS_PX,
          height: canvasHeightPx,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        )}
        {canvasElements.map((el) => {
          let textContent = el.label;
          let imageData: string | null = null;

          if (el.type === 'text') {
            const variable = variables.find((v) => v.id === el.variableId);
            textContent = variable ? rowData[variable.name] ?? '' : '';
          } else if (el.type === 'image') {
            const variable = variables.find((v) => v.id === el.variableId);
            const filename = variable ? rowData[variable.name] ?? '' : '';
            imageData = filename ? uploadedImages[filename] ?? null : null;
          } else if (el.type === 'static') {
            textContent = el.label;
          }

          return (
            <CanvasElementView
              key={el.id}
              el={el}
              textContent={textContent}
              imageData={imageData}
              scale={scale}
              cmToPx={cmToPx}
            />
          );
        })}
      </div>
    );
  }
);

SlidePreview.displayName = 'SlidePreview';
