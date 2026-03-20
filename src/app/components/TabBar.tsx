'use client';

import { FileCode, ScrollText } from 'lucide-react';

export type TabId = 'editor' | 'logs';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  disabled?: boolean;
}

export function TabBar({ activeTab, onTabChange, disabled }: TabBarProps) {
  const tabs: Tab[] = [
    { id: 'editor', label: 'Editor', icon: <FileCode className="w-4 h-4" /> },
    { id: 'logs', label: 'Logs', icon: <ScrollText className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center bg-ha-card border-b border-ha-border">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
            activeTab === tab.id
              ? 'bg-ha-bg text-ha-text border-b-2 border-ha-primary'
              : 'text-ha-text-secondary hover:text-ha-text hover:bg-ha-surface-hover'
          } ${disabled && activeTab !== tab.id ? 'opacity-50' : ''}`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
