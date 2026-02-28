import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import type { FileType } from '@/types';

interface UseFilesReturn {
  content: string;
  originalContent: string;
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
  activeFileType: FileType;
  updateContent: (content: string) => void;
  saveFile: () => Promise<void>;
  setFileType: (type: FileType) => void;
}

export function useFiles(): UseFilesReturn {
  const {
    editorContent,
    originalContent,
    isDirty,
    isSaving,
    editorError,
    activeFileType,
    updateContent: storeUpdateContent,
    saveFile: storeSaveFile,
    setActiveFileType,
  } = useAppStore();

  const saveTimeoutRef = useRef<number | null>(null);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      storeSaveFile();
    }, 1000);
  }, [storeSaveFile]);

  const updateContent = useCallback(
    (content: string) => {
      storeUpdateContent(content);
      debouncedSave();
    },
    [storeUpdateContent, debouncedSave]
  );

  const saveFile = useCallback(async (): Promise<void> => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    await storeSaveFile();
  }, [storeSaveFile]);

  const setFileType = useCallback(
    (type: FileType): void => {
      setActiveFileType(type);
    },
    [setActiveFileType]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    content: editorContent,
    originalContent,
    isDirty,
    isSaving,
    error: editorError,
    activeFileType,
    updateContent,
    saveFile,
    setFileType,
  };
}