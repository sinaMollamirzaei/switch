import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Dashboard } from './components/Dashboard';
import { AddService } from './components/AddService';
import { CarManagement } from './components/CarManagement';
import { SplashScreen } from './components/SplashScreen';
import { PhoneLogin } from './components/PhoneLogin';
import { LayoutDashboard, Plus, Car, Lightbulb } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider } from '@figma/astraui';

type Tab = 'dashboard' | 'addService' | 'cars' | 'insights';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [reminderServiceId, setReminderServiceId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const { t, language } = useApp();
  const { isAuthenticated, showSplash } = useAuth();

  const tabs = [
    { id: 'dashboard' as Tab, label: t('dashboard'), icon: LayoutDashboard },
    { id: 'addService' as Tab, label: t('addService'), icon: Plus },
    { id: 'cars' as Tab, label: t('cars'), icon: Car },
    { id: 'insights' as Tab, label: t('insights'), icon: Lightbulb },
  ];

  const handleStartServiceWithReminder = (serviceId: string) => {
    setReminderServiceId(serviceId);
    setActiveTab('addService');
  };

  const handleEditService = (serviceId: string) => {
    setEditingServiceId(serviceId);
    setActiveTab('addService');
  };

  const handleServiceSuccess = () => {
    setReminderServiceId(null);
    setEditingServiceId(null);
    setActiveTab('dashboard');
  };

  // Show splash screen
  if (showSplash) {
    return (
      <>
        <SplashScreen />
        <Toaster />
      </>
    );
  }

  // Show authentication flow
  if (!isAuthenticated) {
    return (
      <>
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <PhoneLogin />
        </motion.div>
        <Toaster />
      </>
    );
  }

  // Show main app
  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-0 sm:p-6 transition-colors duration-300">
      {/* MARKER-MAKE-KIT-INVOKED */}
      {/* MARKER-MAKE-KIT-DISCOVERY-READ */}
      {/* MARKER-MAKE-KIT-TOKENS-READ */}
      {/* MARKER-MAKE-KIT-FINAL-CHECK-READ */}
      {/* Mobile Container */}
      <div className="relative w-full max-w-[480px] h-screen overflow-hidden bg-background/95 shadow-lg sm:rounded-[calc(var(--radius)+12px)] flex flex-col ring-1 ring-border/70 backdrop-blur-xl">
        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-background">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: language === 'fa' ? 18 : -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: language === 'fa' ? -18 : 18 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                <Dashboard 
                  onNavigate={setActiveTab}
                  onStartServiceWithReminder={handleStartServiceWithReminder}
                  onEditService={handleEditService}
                />
              </motion.div>
            )}
            {activeTab === 'addService' && (
              <motion.div
                key="addService"
                initial={{ opacity: 0, x: language === 'fa' ? 18 : -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: language === 'fa' ? -18 : 18 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                <AddService 
                  onSuccess={handleServiceSuccess}
                  reminderServiceId={reminderServiceId}
                  editingServiceId={editingServiceId}
                />
              </motion.div>
            )}
            {activeTab === 'cars' && (
              <motion.div
                key="cars"
                initial={{ opacity: 0, x: language === 'fa' ? 18 : -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: language === 'fa' ? -18 : 18 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                <CarManagement />
              </motion.div>
            )}
            {activeTab === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, x: language === 'fa' ? 18 : -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: language === 'fa' ? -18 : 18 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className="sticky bottom-0 z-20 bg-card/92 backdrop-blur-xl border-t border-border/70">
          <div className="grid grid-cols-4 items-center gap-1 px-2 pt-2 pb-2 safe-area-bottom">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <React.Fragment key={tab.id}>
                {/* using <button> instead of kit Button: bottom navigation items need native tab semantics and custom vertical label/icon layout not provided by Astra Button */}
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex min-h-14 flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${ isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80' } p-[8px] m-[0px] rounded-[20px]`}
                >
                  <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                    <Icon className="mx-[0px] my-[4px]" size={22} strokeWidth={1.8} />
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-5 rounded-full bg-primary m-[0px] p-[0px]" />
                    )}
                  </div>
                  <span className="text-xs px-[0px] py-[4px]">{tab.label}</span>
                </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider children={undefined}>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}