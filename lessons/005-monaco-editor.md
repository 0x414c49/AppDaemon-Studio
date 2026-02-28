# Lesson 005: Monaco Editor Integration

## What I Learned

### Installation

```bash
npm install @monaco-editor/react
```

### Basic Setup

```typescript
import Editor from '@monaco-editor/react';

<Editor
  height="100%"
  defaultLanguage="python"
  value={code}
  onChange={handleChange}
  options={{
    minimap: { enabled: true },
    lineNumbers: 'on',
    fontSize: 14,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
  }}
/>
```

### Custom Python Support

Add AppDaemon completions:
```typescript
import { loader } from '@monaco-editor/react';

loader.init().then((monaco) => {
  // Register AppDaemon types
  monaco.languages.typescript.javascriptDefaults.addExtraLib(`
    declare class Hass {
      listenState(callback: Function, entity: string): void;
      turnOn(entity: string): void;
      turnOff(entity: string): void;
      log(message: string): void;
      // ... more methods
    }
  `, 'appdaemon.d.ts');
});
```

### Auto-save

```typescript
const [code, setCode] = useState('');
const [isDirty, setIsDirty] = useState(false);

// Debounced save
useEffect(() => {
  if (!isDirty) return;
  
  const timer = setTimeout(() => {
    saveFile(code);
    setIsDirty(false);
  }, 1000);
  
  return () => clearTimeout(timer);
}, [code, isDirty]);

const handleChange = (value: string) => {
  setCode(value);
  setIsDirty(true);
};
```

### Editor Instance Access

```typescript
const editorRef = useRef(null);

const handleEditorDidMount = (editor, monaco) => {
  editorRef.current = editor;
  
  // Add custom commands
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    saveFile(code);
  });
};

// Get selected text
const getSelectedText = () => {
  const selection = editorRef.current.getSelection();
  return editorRef.current.getModel().getValueInRange(selection);
};
```

### Themes

```typescript
// Define custom theme
monaco.editor.defineTheme('appdaemon-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955' },
    { token: 'keyword', foreground: '569CD6' },
  ],
  colors: {
    'editor.background': '#1e1e1e',
  }
});
```

### Multiple Files (Tabs)

```typescript
interface OpenFile {
  id: string;
  name: string;
  content: string;
  isDirty: boolean;
}

const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
const [activeFile, setActiveFile] = useState<string | null>(null);

// Render tabs
{openFiles.map(file => (
  <Tab 
    key={file.id}
    active={file.id === activeFile}
    isDirty={file.isDirty}
  >
    {file.name}
  </Tab>
))}

// Editor shows active file
<Editor 
  key={activeFile}
  value={activeFileContent}
/>
```

## Performance Tips

1. Use `key` prop when switching files
2. Enable `automaticLayout: true`
3. Debounce change handlers
4. Lazy load editor with `loader` config
5. Dispose editor instances properly

## Common Issues

**Editor not resizing**: Enable `automaticLayout` or call `layout()` manually
**Slow initial load**: Use `loader.config` to preload Monaco
**Theme not applying**: Define theme before editor mounts

## Resources

- https://github.com/suren-atoyan/monaco-react
- https://microsoft.github.io/monaco-editor/
