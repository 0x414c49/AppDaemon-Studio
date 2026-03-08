import type { CompletionDefinition } from './types';

export const FILE_PATHS: CompletionDefinition[] = [
  {
    label: '/config/www/',
    insertText: "'/config/www/\${1:filename}'",
    documentation: 'Home Assistant www folder for static files (images, sounds, etc.)',
    detail: 'Path',
  },
  {
    label: '/config/custom_components/',
    insertText: "'/config/custom_components/\${1:component}/'",
    documentation: 'Custom integrations directory',
    detail: 'Path',
  },
  {
    label: '/config/appdaemon/apps/',
    insertText: "'/config/appdaemon/apps/\${1:appname}/'",
    documentation: 'AppDaemon apps directory',
    detail: 'Path',
  },
  {
    label: '/config/appdaemon.yaml',
    insertText: "'/config/appdaemon.yaml'",
    documentation: 'AppDaemon configuration file',
    detail: 'Path',
  },
  {
    label: '/config/secrets.yaml',
    insertText: "'/config/secrets.yaml'",
    documentation: 'Home Assistant secrets file',
    detail: 'Path',
  },
  {
    label: '/config/',
    insertText: "'/config/\${1:filename}'",
    documentation: 'Home Assistant config root',
    detail: 'Path',
  },
];
