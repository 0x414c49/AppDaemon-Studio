export interface YamlSnippet {
  label: string;
  insertText: string;
  documentation: string;
  detail: string;
}

export const YAML_APPDAEMON_SNIPPETS: YamlSnippet[] = [
  // Core app keys
  {
    label: 'module',
    insertText: 'module: ${1:app_module}',
    documentation: 'Python module name (filename without .py extension)',
    detail: 'AppDaemon key',
  },
  {
    label: 'class',
    insertText: 'class: ${1:AppClass}',
    documentation: 'Python class name inside the module',
    detail: 'AppDaemon key',
  },
  {
    label: 'description',
    insertText: 'description: "${1:App description}"',
    documentation: 'Human-readable description of the app',
    detail: 'AppDaemon key',
  },
  {
    label: 'icon',
    insertText: 'icon: ${1:mdi:home-automation}',
    documentation: 'MDI icon for the app (used in UI)',
    detail: 'AppDaemon key',
  },
  // Constraints
  {
    label: 'constrain_input_boolean',
    insertText: 'constrain_input_boolean: ${1:input_boolean.my_flag,on}',
    documentation: 'Only run app when input_boolean is in given state (e.g. input_boolean.guest_mode,off)',
    detail: 'Constraint',
  },
  {
    label: 'constrain_input_select',
    insertText: 'constrain_input_select: ${1:input_select.mode,Home}',
    documentation: 'Only run app when input_select equals given option',
    detail: 'Constraint',
  },
  {
    label: 'constrain_presence',
    insertText: 'constrain_presence: ${1:everyone_home}',
    documentation: 'Constrain by presence: everyone_home, anyone_home, noone_home, everyone_away, anyone_away',
    detail: 'Constraint',
  },
  // Common app args
  {
    label: 'log_level',
    insertText: 'log_level: ${1:INFO}',
    documentation: 'Log level: DEBUG, INFO, WARNING, ERROR, CRITICAL',
    detail: 'AppDaemon key',
  },
  {
    label: 'dependencies',
    insertText: 'dependencies:\n  - ${1:other_app}',
    documentation: 'List of app names this app depends on (loaded first)',
    detail: 'AppDaemon key',
  },
  // Full app skeleton snippet
  {
    label: 'app (new app skeleton)',
    insertText: [
      '${1:MyApp}:',
      '  module: ${2:my_app}',
      '  class: ${1:MyApp}',
    ].join('\n'),
    documentation: 'New AppDaemon app entry with module and class',
    detail: 'Snippet',
  },
];
