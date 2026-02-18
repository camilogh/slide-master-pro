import { useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SLIDE_PRESETS, SlideDimensions } from '@/types/pptx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Image, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Step1 = () => {
  const { dimensions, backgroundImage, setDimensions, setBackgroundImage, setCurrentStep } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handlePreset = (preset: SlideDimensions & { label: string }) => {
    setDimensions({ width: preset.width, height: preset.height });
  };

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setBackgroundImage(e.target?.result as string, file);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImageFile(file);
  };

  const canContinue = backgroundImage !== null;

  return (
    <div className="space-y-8">
      {/* Dimensions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Dimensiones del slide</h2>
        <div className="flex flex-wrap gap-2">
          {SLIDE_PRESETS.map(preset => {
            const active = dimensions.width === preset.width && dimensions.height === preset.height;
            return (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset)}
                className={cn(
                  'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:border-primary'
                )}
              >
                {preset.label}
              </button>
            );
          })}
          <button
            onClick={() => setDimensions({ width: dimensions.width, height: dimensions.height })}
            className="px-4 py-2 rounded-lg border text-sm font-medium border-border bg-background text-muted-foreground hover:border-primary transition-colors"
          >
            Personalizado
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-xs">
          <div className="space-y-1">
            <Label htmlFor="width" className="text-xs text-muted-foreground">Ancho (cm)</Label>
            <Input
              id="width"
              type="number"
              step="0.1"
              min="1"
              value={dimensions.width}
              onChange={e => setDimensions({ ...dimensions, width: parseFloat(e.target.value) || dimensions.width })}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="height" className="text-xs text-muted-foreground">Alto (cm)</Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              min="1"
              value={dimensions.height}
              onChange={e => setDimensions({ ...dimensions, height: parseFloat(e.target.value) || dimensions.height })}
              className="h-9"
            />
          </div>
        </div>

        {/* Preview aspect */}
        <div className="flex items-center gap-3">
          <div
            className="border-2 border-dashed border-muted rounded bg-muted/20"
            style={{
              width: Math.min(dimensions.width * 4, 200),
              height: Math.min(dimensions.height * 4, 200) * (dimensions.height / dimensions.width) < 150
                ? dimensions.height / dimensions.width * Math.min(dimensions.width * 4, 200)
                : 150,
            }}
          />
          <span className="text-sm text-muted-foreground">{dimensions.width} × {dimensions.height} cm</span>
        </div>
      </div>

      {/* Background image */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Imagen de fondo (plantilla)</h2>
        <div
          className={cn(
            'relative border-2 border-dashed rounded-xl transition-colors cursor-pointer overflow-hidden',
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            backgroundImage ? 'p-0' : 'p-12'
          )}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {backgroundImage ? (
            <div className="relative group">
              <img
                src={backgroundImage}
                alt="Imagen de fondo"
                className="w-full h-64 object-contain bg-muted/20"
              />
          <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-background text-sm font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Cambiar imagen
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                <Image className="w-7 h-7" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Arrastra tu imagen aquí</p>
                <p className="text-sm mt-1">o haz clic para seleccionar</p>
                <p className="text-xs mt-1">PNG, JPG, WEBP</p>
              </div>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
          }}
        />

        {backgroundImage && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-3 px-4 flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">Imagen de fondo cargada correctamente</span>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          onClick={() => setCurrentStep(2)}
          disabled={!canContinue}
          className="gap-2"
        >
          Siguiente: Datos Excel <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
