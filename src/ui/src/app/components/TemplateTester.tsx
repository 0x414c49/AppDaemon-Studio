'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

export function TemplateTester() {
  const [template, setTemplate] = useState('{{ states("sun.sun") }}');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const evaluate = async () => {
    if (!template.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('api/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'Failed to evaluate template');
      } else {
        setResult(data.result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) evaluate();
  };

  return (
    <div className="flex flex-col h-full bg-ha-bg">
      <div className="p-3 border-b border-ha-border bg-ha-card">
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter Jinja2 template, e.g. {{ states('sensor.temperature') }}"
          className="w-full h-32 px-3 py-2 bg-ha-surface border border-ha-border rounded text-ha-text font-mono text-sm focus:outline-none focus:border-ha-primary resize-none"
          spellCheck={false}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-ha-text-secondary">Ctrl+Enter to run</span>
          <button
            onClick={evaluate}
            disabled={isLoading || !template.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-ha-primary hover:bg-ha-primary-dark text-white text-sm rounded transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {isLoading ? 'Evaluating…' : 'Evaluate'}
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {error ? (
          <pre className="text-ha-error font-mono text-sm whitespace-pre-wrap">{error}</pre>
        ) : result !== null ? (
          <pre className="text-ha-text font-mono text-sm whitespace-pre-wrap">{result}</pre>
        ) : (
          <p className="text-ha-text-secondary text-sm">Result will appear here</p>
        )}
      </div>
    </div>
  );
}
