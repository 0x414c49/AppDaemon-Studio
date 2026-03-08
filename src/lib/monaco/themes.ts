import type { editor } from 'monaco-editor';

type MonacoTheme = editor.IStandaloneThemeData;

const oneDarkPro: MonacoTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '5c6773', fontStyle: 'italic' },
    { token: 'constant', foreground: 'e6b450' },
    { token: 'entity', foreground: '59c2ff' },
    { token: 'keyword', foreground: 'ff8f40' },
    { token: 'storage', foreground: 'ff8f40' },
    { token: 'string', foreground: '98e6a8' },
    { token: 'support', foreground: '59c2ff' },
    { token: 'variable', foreground: 'd19a66' },
    { token: 'type', foreground: '59c2ff' },
    { token: 'function', foreground: 'ffb454' },
    { token: 'number', foreground: 'e6b450' },
    { token: 'operator', foreground: 'ff8f40' },
    { token: 'punctuation', foreground: 'abb2bf' },
  ],
  colors: {
    'editor.background': '#282c34',
    'editor.foreground': '#abb2bf',
    'editorLineNumber.foreground': '#495162',
    'editorLineNumber.activeForeground': '#abb2bf',
    'editor.selectionBackground': '#3e4451',
    'editor.inactiveSelectionBackground': '#3e4451',
    'editorIndentGuide.background': '#3b4048',
    'editorIndentGuide.activeBackground': '#c8c8c8',
  },
};

const dracula: MonacoTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
    { token: 'constant', foreground: 'bd93f9' },
    { token: 'entity', foreground: '50fa7b' },
    { token: 'keyword', foreground: 'ff79c6' },
    { token: 'storage', foreground: 'ff79c6' },
    { token: 'string', foreground: 'f1fa8c' },
    { token: 'support', foreground: '8be9fd' },
    { token: 'variable', foreground: 'f8f8f2' },
    { token: 'type', foreground: '8be9fd' },
    { token: 'function', foreground: '50fa7b' },
    { token: 'number', foreground: 'bd93f9' },
    { token: 'operator', foreground: 'ff79c6' },
  ],
  colors: {
    'editor.background': '#282a36',
    'editor.foreground': '#f8f8f2',
    'editorLineNumber.foreground': '#6272a4',
    'editorLineNumber.activeForeground': '#f8f8f2',
    'editor.selectionBackground': '#44475a',
    'editor.inactiveSelectionBackground': '#44475a',
  },
};

const githubDark: MonacoTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
    { token: 'constant', foreground: '79c0ff' },
    { token: 'entity', foreground: 'd2a8ff' },
    { token: 'keyword', foreground: 'ff7b72' },
    { token: 'storage', foreground: 'ff7b72' },
    { token: 'string', foreground: 'a5d6ff' },
    { token: 'support', foreground: '7ee787' },
    { token: 'variable', foreground: 'ffa657' },
    { token: 'type', foreground: '79c0ff' },
    { token: 'function', foreground: 'd2a8ff' },
    { token: 'number', foreground: '79c0ff' },
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#c9d1d9',
    'editorLineNumber.foreground': '#6e7681',
    'editorLineNumber.activeForeground': '#c9d1d9',
    'editor.selectionBackground': '#264f78',
  },
};

const nord: MonacoTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '616e88', fontStyle: 'italic' },
    { token: 'constant', foreground: '81a1c1' },
    { token: 'entity', foreground: '8fbcbb' },
    { token: 'keyword', foreground: '81a1c1' },
    { token: 'storage', foreground: '81a1c1' },
    { token: 'string', foreground: 'a3be8c' },
    { token: 'support', foreground: '88c0d0' },
    { token: 'variable', foreground: 'd8dee9' },
    { token: 'type', foreground: '8fbcbb' },
    { token: 'function', foreground: '88c0d0' },
    { token: 'number', foreground: 'b48ead' },
  ],
  colors: {
    'editor.background': '#2e3440',
    'editor.foreground': '#d8dee9',
    'editorLineNumber.foreground': '#4c566a',
    'editorLineNumber.activeForeground': '#d8dee9',
    'editor.selectionBackground': '#434c5e',
  },
};

const monokai: MonacoTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
    { token: 'constant', foreground: 'ae81ff' },
    { token: 'entity', foreground: 'a6e22e' },
    { token: 'keyword', foreground: 'f92672' },
    { token: 'storage', foreground: 'f92672' },
    { token: 'string', foreground: 'e6db74' },
    { token: 'support', foreground: '66d9ef' },
    { token: 'variable', foreground: 'f8f8f2' },
    { token: 'type', foreground: '66d9ef' },
    { token: 'function', foreground: 'a6e22e' },
    { token: 'number', foreground: 'ae81ff' },
  ],
  colors: {
    'editor.background': '#272822',
    'editor.foreground': '#f8f8f2',
    'editorLineNumber.foreground': '#75715e',
    'editorLineNumber.activeForeground': '#f8f8f2',
    'editor.selectionBackground': '#49483e',
  },
};

const solarizedDark: MonacoTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '586e75', fontStyle: 'italic' },
    { token: 'constant', foreground: '268bd2' },
    { token: 'entity', foreground: 'b58900' },
    { token: 'keyword', foreground: '859900' },
    { token: 'storage', foreground: '859900' },
    { token: 'string', foreground: '2aa198' },
    { token: 'support', foreground: '268bd2' },
    { token: 'variable', foreground: '839496' },
    { token: 'type', foreground: 'b58900' },
    { token: 'function', foreground: '268bd2' },
    { token: 'number', foreground: 'd33682' },
  ],
  colors: {
    'editor.background': '#002b36',
    'editor.foreground': '#839496',
    'editorLineNumber.foreground': '#586e75',
    'editorLineNumber.activeForeground': '#839496',
    'editor.selectionBackground': '#073642',
  },
};

const nightOwl: MonacoTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '637777', fontStyle: 'italic' },
    { token: 'constant', foreground: 'f78c6c' },
    { token: 'entity', foreground: '82aaff' },
    { token: 'keyword', foreground: 'c792ea' },
    { token: 'storage', foreground: 'c792ea' },
    { token: 'string', foreground: 'c3e88d' },
    { token: 'support', foreground: '82aaff' },
    { token: 'variable', foreground: 'd6deeb' },
    { token: 'type', foreground: 'ffcb6b' },
    { token: 'function', foreground: '82aaff' },
    { token: 'number', foreground: 'f78c6c' },
  ],
  colors: {
    'editor.background': '#011627',
    'editor.foreground': '#d6deeb',
    'editorLineNumber.foreground': '#4b6479',
    'editorLineNumber.activeForeground': '#d6deeb',
    'editor.selectionBackground': '#1d3b53',
  },
};

const customThemes: Record<string, MonacoTheme> = {
  'one-dark-pro': oneDarkPro,
  'dracula': dracula,
  'github-dark': githubDark,
  'nord': nord,
  'monokai': monokai,
  'solarized-dark': solarizedDark,
  'night-owl': nightOwl,
};

export function registerCustomThemes(monaco: typeof import('monaco-editor')): void {
  Object.entries(customThemes).forEach(([themeId, theme]) => {
    monaco.editor.defineTheme(themeId, theme);
  });
}
