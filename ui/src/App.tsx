import React from 'react';
import { useAppStore } from '@/store/appStore';
import { Layout } from './components/Layout';
import { CreateAppModal } from './components/Wizard/CreateAppModal';

const App: React.FC = () => {
  const { showCreateModal, setShowCreateModal } = useAppStore();

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
      <Layout />
      <CreateAppModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default App;
