import { useState } from 'react';
import PptxGenJS from 'pptxgenjs';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Download, Loader2, CheckCircle2, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';

// Convert hex color to RRGGBB
const hexToRGB = (hex: string) => hex.replace('#', '');

export const Step4 = () => {
  const {
    dimensions, backgroundImage, excelData, variables,
    canvasElements, uploadedImages, setCurrentStep,
  } = useApp();

  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const textElements = canvasElements.filter(el => el.type === 'text' || el.type === 'static');
  const imageElements = canvasElements.filter(el => el.type === 'image');

  const handleGenerate = async () => {
    setStatus('generating');
    setProgress(0);
    setErrorMsg('');

    try {
      const pptx = new PptxGenJS();
      pptx.defineLayout({
        name: 'CUSTOM',
        width: dimensions.width / 2.54,  // convert cm to inches
        height: dimensions.height / 2.54,
      });
      pptx.layout = 'CUSTOM';

      const totalSlides = excelData.length;

      for (let i = 0; i < totalSlides; i++) {
        const row = excelData[i];
        const slide = pptx.addSlide();

        // Background image
        if (backgroundImage) {
          slide.addImage({
            data: backgroundImage,
            x: 0, y: 0,
            w: dimensions.width / 2.54,
            h: dimensions.height / 2.54,
          });
        }

        // Canvas elements
        for (const el of canvasElements) {
          const x = el.x / 2.54;
          const y = el.y / 2.54;
          const w = el.width / 2.54;
          const h = el.height / 2.54;

          if (el.type === 'static') {
            // Static text
            slide.addText(el.label, {
              x, y, w, h,
              fontFace: el.style?.fontFamily ?? 'Arial',
              fontSize: el.style?.fontSize ?? 18,
              color: hexToRGB(el.style?.color ?? '#000000'),
              align: el.style?.align ?? 'left',
              bold: el.style?.bold ?? false,
              italic: el.style?.italic ?? false,
              wrap: true,
            });
          } else if (el.type === 'text') {
            // Variable text
            const variable = variables.find(v => v.id === el.variableId);
            if (!variable) continue;
            const value = row[variable.name] ?? '';
            slide.addText(value, {
              x, y, w, h,
              fontFace: el.style?.fontFamily ?? 'Arial',
              fontSize: el.style?.fontSize ?? 18,
              color: hexToRGB(el.style?.color ?? '#000000'),
              align: el.style?.align ?? 'left',
              bold: el.style?.bold ?? false,
              italic: el.style?.italic ?? false,
              wrap: true,
            });
          } else if (el.type === 'image') {
            // Variable image
            const variable = variables.find(v => v.id === el.variableId);
            if (!variable) continue;
            const filename = row[variable.name] ?? '';
            const imageData = uploadedImages[filename];
            if (imageData) {
              slide.addImage({ data: imageData, x, y, w, h, sizing: { type: 'contain', w, h } });
            }
          }
        }

        setProgress(Math.round(((i + 1) / totalSlides) * 100));
        // Yield to UI
        await new Promise(r => setTimeout(r, 0));
      }

      await pptx.writeFile({ fileName: `presentacion_${Date.now()}.pptx` });
      setStatus('done');
    } catch (e) {
      console.error(e);
      setErrorMsg(e instanceof Error ? e.message : 'Error desconocido');
      setStatus('error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Resumen del proyecto</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Slides', value: excelData.length, icon: FileText },
            { label: 'Variables texto', value: textElements.length, icon: FileText },
            { label: 'Variables imagen', value: imageElements.length, icon: ImageIcon },
            { label: 'Imágenes cargadas', value: Object.keys(uploadedImages).length, icon: ImageIcon },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="py-4 px-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dimensions */}
        <p className="text-sm text-muted-foreground">
          Formato: <strong>{dimensions.width} × {dimensions.height} cm</strong>
        </p>
      </div>

      {/* Elements list */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Elementos en el diseño</h3>
        <div className="flex flex-wrap gap-2">
          {canvasElements.map(el => (
            <span
              key={el.id}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm text-muted-foreground"
            >
              {el.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              {el.type === 'static' ? `"${el.label.slice(0, 20)}"` : el.label}
            </span>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <div className="space-y-4">
        {status === 'idle' && (
          <Button size="lg" onClick={handleGenerate} className="gap-2 w-full md:w-auto">
            <Download className="w-5 h-5" /> Generar PowerPoint
          </Button>
        )}

        {status === 'generating' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-foreground font-medium">Generando {excelData.length} slides...</span>
            </div>
            <div className="w-full max-w-sm bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">{progress}% completado</p>
          </div>
        )}

        {status === 'done' && (
          <Card className="border-primary/30 bg-primary/5 max-w-sm">
            <CardContent className="py-4 px-5 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-foreground">¡PowerPoint generado!</p>
                <p className="text-sm text-muted-foreground">El archivo se ha descargado automáticamente</p>
              </div>
            </CardContent>
          </Card>
        )}

        {status === 'error' && (
          <Card className="border-destructive/30 bg-destructive/5 max-w-sm">
            <CardContent className="py-4 px-5 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Error al generar</p>
                <p className="text-sm text-muted-foreground">{errorMsg}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {(status === 'done' || status === 'error') && (
          <Button variant="outline" onClick={handleGenerate} className="gap-2">
            <Download className="w-4 h-4" /> Generar de nuevo
          </Button>
        )}
      </div>

      <div className="flex justify-start pt-4 border-t border-border">
        <Button variant="outline" onClick={() => setCurrentStep(3)} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Editar diseño
        </Button>
      </div>
    </div>
  );
};
