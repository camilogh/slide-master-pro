import { forwardRef } from 'react';
import type { CanvasElement, Variable, SlideDimensions } from '@/types/pptx';

const CANVAS_PX = 900;

interface SlidePreviewProps {
  dimensions: SlideDimensions;
  backgroundImage: string | null;
  canvasElements: CanvasElement[];
  variables: Variable[];
  rowData: Record<string, string>;
  uploadedImages: Record<string, string>;
}

/** Renderiza el slide con datos del primer registro para captura con html2canvas */
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
          const fontSizePt = (el.style?.fontSize ?? 18) * (scale / 28.35);
          if (el.type === 'static') {
            const align = el.style?.align ?? 'left';
            return (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: cmToPx(el.x),
                  top: cmToPx(el.y),
                  width: cmToPx(el.width),
                  height: cmToPx(el.height),
                  fontFamily: el.style?.fontFamily ?? 'Arial',
                  fontSize: fontSizePt,
                  color: el.style?.color ?? '#000000',
                  textAlign: align,
                  fontWeight: el.style?.bold ? 'bold' : 'normal',
                  fontStyle: el.style?.italic ? 'italic' : 'normal',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span style={{ width: '100%', minWidth: 0, textAlign: align }}>{el.label}</span>
              </div>
            );
          }
          if (el.type === 'text') {
            const variable = variables.find((v) => v.id === el.variableId);
            const value = variable ? rowData[variable.name] ?? '' : '';
            const align = el.style?.align ?? 'left';
            return (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: cmToPx(el.x),
                  top: cmToPx(el.y),
                  width: cmToPx(el.width),
                  height: cmToPx(el.height),
                  fontFamily: el.style?.fontFamily ?? 'Arial',
                  fontSize: fontSizePt,
                  color: el.style?.color ?? '#000000',
                  textAlign: align,
                  fontWeight: el.style?.bold ? 'bold' : 'normal',
                  fontStyle: el.style?.italic ? 'italic' : 'normal',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span style={{ width: '100%', minWidth: 0, textAlign: align }}>{value}</span>
              </div>
            );
          }
          if (el.type === 'image') {
            const variable = variables.find((v) => v.id === el.variableId);
            const filename = variable ? rowData[variable.name] ?? '' : '';
            const imageData = uploadedImages[filename];
            return (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: cmToPx(el.x),
                  top: cmToPx(el.y),
                  width: cmToPx(el.width),
                  height: cmToPx(el.height),
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {imageData ? (
                  <img
                    src={imageData}
                    alt=""
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 12, color: '#999' }}>{el.label}</span>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }
);

SlidePreview.displayName = 'SlidePreview';
