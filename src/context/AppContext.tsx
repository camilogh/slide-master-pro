import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, CanvasElement, Variable, SlideDimensions, DEFAULT_DIMENSIONS } from '@/types/pptx';

interface AppContextValue extends AppState {
  setDimensions: (d: SlideDimensions) => void;
  setBackgroundImage: (dataUrl: string | null, file: File | null) => void;
  setExcelData: (data: Record<string, string>[], variables: Variable[]) => void;
  setUploadedImages: (images: Record<string, string>) => void;
  setVariables: (variables: Variable[]) => void;
  addCanvasElement: (el: CanvasElement) => void;
  updateCanvasElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeCanvasElement: (id: string) => void;
  setCanvasElements: (elements: CanvasElement[]) => void;
  setCurrentStep: (step: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>({
    dimensions: DEFAULT_DIMENSIONS,
    backgroundImage: null,
    backgroundImageFile: null,
    excelData: [],
    variables: [],
    uploadedImages: {},
    canvasElements: [],
    currentStep: 1,
  });

  const setDimensions = (dimensions: SlideDimensions) =>
    setState(s => ({ ...s, dimensions }));

  const setBackgroundImage = (backgroundImage: string | null, backgroundImageFile: File | null) =>
    setState(s => ({ ...s, backgroundImage, backgroundImageFile }));

  const setExcelData = (excelData: Record<string, string>[], variables: Variable[]) =>
    setState(s => ({ ...s, excelData, variables }));

  const setUploadedImages = (uploadedImages: Record<string, string>) =>
    setState(s => ({ ...s, uploadedImages }));

  const setVariables = (variables: Variable[]) =>
    setState(s => ({ ...s, variables }));

  const addCanvasElement = (el: CanvasElement) =>
    setState(s => ({ ...s, canvasElements: [...s.canvasElements, el] }));

  const updateCanvasElement = (id: string, updates: Partial<CanvasElement>) =>
    setState(s => ({
      ...s,
      canvasElements: s.canvasElements.map(el => el.id === id ? { ...el, ...updates } : el),
    }));

  const removeCanvasElement = (id: string) =>
    setState(s => ({ ...s, canvasElements: s.canvasElements.filter(el => el.id !== id) }));

  const setCanvasElements = (canvasElements: CanvasElement[]) =>
    setState(s => ({ ...s, canvasElements }));

  const setCurrentStep = (currentStep: number) =>
    setState(s => ({ ...s, currentStep }));

  return (
    <AppContext.Provider value={{
      ...state,
      setDimensions,
      setBackgroundImage,
      setExcelData,
      setUploadedImages,
      setVariables,
      addCanvasElement,
      updateCanvasElement,
      removeCanvasElement,
      setCanvasElements,
      setCurrentStep,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
