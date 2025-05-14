
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const Tabs = ({ tabs, activeTab, onTabChange, className }: TabsProps) => {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors focus:outline-none',
              activeTab === tab.id
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              'h-full',
              activeTab === tab.id ? 'block' : 'hidden'
            )}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};
