import React, { useCallback } from 'react';
import Editor from '@monaco-editor/react';
import {
  Save,
  FileCode,
  FileJson,
  History,
  Circle,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useFiles } from '@/hooks/useFiles';

export const EditorPanel: React.FC = () => {
  const {
    content,
    isDirty,
    isSaving,
    activeFileType,
    updateContent,
    saveFile,
    setFileType,
  } = useFiles();

  const { activeApp, setBottomPanelTab } = useAppStore();

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        updateContent(value);
      }
    },
    [updateContent]
  );

  const handleSave = useCallback(async () => {
    if (isDirty) {
      await saveFile();
    }
  }, [isDirty, saveFile]);

  const getLanguage = () => {
    return activeFileType === 'python' ? 'python' : 'yaml';
  };

  const getFileName = () => {
    if (!activeApp) return 'No file selected';
    return activeFileType === 'python'
      ? `${activeApp}.py`
      : `${activeApp}.yaml`;
  };

  if (!activeApp) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <FileCode className="w-16 h-16 mx-auto text-slate-700 mb-4" />
          <p className="text-slate-500 text-lg">Select an app to start editing</p>
          <p className="text-slate-600 text-sm mt-2">
            Choose a file from the sidebar or create a new app
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            {isDirty && (
              <Circle className="w-2 h-2 fill-yellow-500 text-yellow-500" />
            )}
            <span className="font-medium text-slate-200">{getFileName()}</span>
            {isDirty && (
              <span className="text-xs text-yellow-500">Unsaved changes</span>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-800 rounded-md p-0.5">
            <button
              onClick={() => setFileType('python')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                activeFileType === 'python'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Python
            </button>
            <button
              onClick={() => setFileType('yaml')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                activeFileType === 'yaml'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              YAML
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBottomPanelTab('versions')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Versions</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
              isDirty
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isSaving ? 'Saving...' : 'Save'}
            </span>
            <span className="text-xs opacity-70 hidden md:inline">(Ctrl+S)</span>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={getLanguage()}
          value={content}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            padding: { top: 16 },
            scrollbars: {
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
              vertical: 'auto',
              horizontal: 'auto',
            },
          }}
        />
      </div>
    </div>
  );
};
