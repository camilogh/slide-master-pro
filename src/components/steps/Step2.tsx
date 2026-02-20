import { useRef, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '@/context/AppContext';
import { Variable } from '@/types/pptx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, Images, ChevronRight, ChevronLeft, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Convierte fila de valores en headers únicos (__EMPTY para celdas vacías, como SheetJS) */
function toHeaders(row: unknown[]): string[] {
  const seen = new Map<string, number>();
  return row.map((cell, i) => {
    const raw = cell != null && String(cell).trim() !== '' ? String(cell) : null;
    const base = raw ?? '__EMPTY';
    let key = base;
    if (seen.has(base)) {
      const n = seen.get(base)! + 1;
      seen.set(base, n);
      key = `${base}_${n}`;
    } else {
      seen.set(base, 0);
    }
    return key;
  });
}

export const Step2 = () => {
  const {
    excelData, variables, uploadedImages,
    setExcelData, setUploadedImages, setVariables,
    setCurrentStep,
  } = useApp();

  const excelInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const [dragOverExcel, setDragOverExcel] = useState(false);
  const [dragOverImages, setDragOverImages] = useState(false);
  const [rawSheetRows, setRawSheetRows] = useState<unknown[][]>([]);
  const [headerRow, setHeaderRow] = useState(1);

  const applyHeaderRow = useCallback((rows: unknown[][], rowNum: number) => {
    if (rows.length === 0) return;
    const idx = Math.max(0, Math.min(rowNum - 1, rows.length - 1));
    const headerRowData = rows[idx];
    const maxCols = Math.max(...rows.map(r => (Array.isArray(r) ? r : []).length));
    const headerValues = Array.isArray(headerRowData)
      ? [...headerRowData]
      : [];
    while (headerValues.length < maxCols) headerValues.push('');
    const headers = toHeaders(headerValues);
    const dataRows = rows.slice(idx + 1);
    const vars: Variable[] = headers.map(h => {
      const existing = variables.find(v => v.name === h);
      return {
        id: existing?.id ?? crypto.randomUUID(),
        name: h,
        type: existing?.type ?? 'text',
      };
    });
    const data: Record<string, string>[] = dataRows.map(row => {
      const arr = Array.isArray(row) ? row : [];
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = arr[i] != null ? String(arr[i]) : '';
      });
      return obj;
    });
    setExcelData(data, vars);
  }, [setExcelData, variables]);

  const processExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
      if (rows.length === 0) return;
      setRawSheetRows(rows);
      setHeaderRow(1);
      applyHeaderRow(rows, 1);
    };
    reader.readAsArrayBuffer(file);
  };

  const processImages = (files: FileList) => {
    const newImages: Record<string, string> = { ...uploadedImages };
    let pending = files.length;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newImages[file.name] = e.target?.result as string;
        pending--;
        if (pending === 0) {
          // Auto-detect image columns
          setUploadedImages(newImages);
          autoDetectImageColumns(newImages);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const autoDetectImageColumns = (images: Record<string, string>) => {
    if (excelData.length === 0) return;
    const imageFiles = new Set(Object.keys(images));
    const updated = variables.map(v => {
      // Check if any cell value in this column matches an uploaded filename
      const isImage = excelData.some(row => imageFiles.has(row[v.name]));
      return { ...v, type: isImage ? 'image' as const : 'text' as const };
    });
    setVariables(updated);
  };

  const toggleVarType = (id: string) => {
    setVariables(variables.map(v =>
      v.id === id ? { ...v, type: v.type === 'image' ? 'text' : 'image' } : v
    ));
  };

  const canContinue = excelData.length > 0;
  const previewRows = excelData.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Excel upload */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Archivo Excel</h2>
        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-10 transition-colors cursor-pointer flex flex-col items-center gap-3',
            dragOverExcel ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          )}
          onDragOver={e => { e.preventDefault(); setDragOverExcel(true); }}
          onDragLeave={() => setDragOverExcel(false)}
          onDrop={e => {
            e.preventDefault(); setDragOverExcel(false);
            const file = e.dataTransfer.files[0];
            if (file) processExcel(file);
          }}
          onClick={() => excelInputRef.current?.click()}
        >
          <FileSpreadsheet className="w-10 h-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium text-foreground">
              {excelData.length > 0 ? `✓ ${excelData.length} filas cargadas` : 'Arrastra tu Excel aquí'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {excelData.length > 0 ? `${variables.length} columnas detectadas` : 'o haz clic para seleccionar · .xlsx, .xls'}
            </p>
          </div>
        </div>
        <input
          ref={excelInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) processExcel(f); }}
        />

        {/* Selector de fila de encabezados */}
        {rawSheetRows.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <Label htmlFor="header-row" className="text-sm text-foreground">
              Fila que contiene los encabezados de la tabla:
            </Label>
            <select
              id="header-row"
              value={headerRow}
              onChange={e => {
                const n = parseInt(e.target.value, 10);
                setHeaderRow(n);
                applyHeaderRow(rawSheetRows, n);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {Array.from({ length: Math.min(rawSheetRows.length, 100) }, (_, i) => (
                <option key={i} value={i + 1}>Fila {i + 1}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              Los datos se tomarán a partir de la fila {headerRow + 1}
            </span>
          </div>
        )}
      </div>

      {/* Variables detected */}
      {variables.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-foreground text-sm">Variables detectadas — haz clic para cambiar el tipo</h3>
          <div className="flex flex-wrap gap-2">
            {variables.map(v => (
              <button
                key={v.id}
                onClick={() => toggleVarType(v.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors',
                  v.type === 'image'
                    ? 'bg-secondary text-secondary-foreground border-secondary'
                    : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                )}
              >
                {v.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                {v.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            🖼️ Columnas tipo imagen (morado) · 📝 Columnas tipo texto (gris)
          </p>
        </div>
      )}

      {/* Image upload */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Imágenes para variables de tipo imagen
          <span className="text-sm font-normal text-muted-foreground ml-2">(opcional)</span>
        </h2>
        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer flex flex-col items-center gap-3',
            dragOverImages ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          )}
          onDragOver={e => { e.preventDefault(); setDragOverImages(true); }}
          onDragLeave={() => setDragOverImages(false)}
          onDrop={e => {
            e.preventDefault(); setDragOverImages(false);
            processImages(e.dataTransfer.files);
          }}
          onClick={() => imagesInputRef.current?.click()}
        >
          <Images className="w-10 h-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium text-foreground">
              {Object.keys(uploadedImages).length > 0
                ? `✓ ${Object.keys(uploadedImages).length} imágenes cargadas`
                : 'Carga masiva de imágenes'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Selecciona múltiples archivos o arrastra una carpeta
            </p>
          </div>
        </div>
        <input
          ref={imagesInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files?.length) processImages(e.target.files); }}
        />

        {Object.keys(uploadedImages).length > 0 && (
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {Object.keys(uploadedImages).map(name => (
              <span key={name} className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Preview table */}
      {previewRows.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-foreground text-sm">Vista previa de datos ({excelData.length} filas)</h3>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {variables.map(v => (
                      <TableHead key={v.id} className="whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          {v.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          {v.name}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, i) => (
                    <TableRow key={i}>
                      {variables.map(v => (
                        <TableCell key={v.id} className="max-w-[150px] truncate text-xs">
                          {row[v.name]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {excelData.length > 5 && (
            <p className="text-xs text-muted-foreground">Mostrando 5 de {excelData.length} filas</p>
          )}
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Atrás
        </Button>
        <Button onClick={() => setCurrentStep(3)} disabled={!canContinue} className="gap-2">
          Siguiente: Diseño <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
