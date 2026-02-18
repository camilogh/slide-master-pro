export type VariableType = 'text' | 'image';

export interface Variable {
  id: string;
  name: string;  // column header
  type: VariableType;
}

export type TextAlign = 'left' | 'center' | 'right';

export interface TextStyle {
  fontFamily: string;
  fontSize: number; // pt
  color: string; // hex
  align: TextAlign;
  bold: boolean;
  italic: boolean;
}

export interface CanvasElement {
  id: string;
  variableId: string | null; // null = static text
  type: VariableType | 'static';
  label: string; // variable name or static text content
  // position in cm
  x: number;
  y: number;
  // size in cm
  width: number;
  height: number;
  // text style (for text & static)
  style?: TextStyle;
  // image: keep aspect ratio
  keepAspectRatio?: boolean;
}

export interface SlideDimensions {
  width: number;  // cm
  height: number; // cm
}

export interface AppState {
  // Step 1
  dimensions: SlideDimensions;
  backgroundImage: string | null; // data URL
  backgroundImageFile: File | null;

  // Step 2
  excelData: Record<string, string>[];
  variables: Variable[];
  uploadedImages: Record<string, string>; // filename -> data URL

  // Step 3
  canvasElements: CanvasElement[];

  // Navigation
  currentStep: number;
}

export const DEFAULT_DIMENSIONS: SlideDimensions = { width: 29.7, height: 21 };

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Arial',
  fontSize: 18,
  color: '#000000',
  align: 'left',
  bold: false,
  italic: false,
};

export const SLIDE_PRESETS = [
  { label: 'A4 Horizontal', width: 29.7, height: 21 },
  { label: 'A4 Vertical', width: 21, height: 29.7 },
  { label: '16:9', width: 33.867, height: 19.05 },
  { label: '4:3', width: 25.4, height: 19.05 },
];
