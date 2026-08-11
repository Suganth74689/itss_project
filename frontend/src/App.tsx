import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, type ModuleType } from './components/Sidebar';
import { Customer360 } from './pages/Customer360';
import { KYCAssistant } from './pages/KYCAssistant';
import { FAQAssistant } from './pages/FAQAssistant';
import { LookalikeExplainer } from './pages/LookalikeExplainer';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { fetchCustomers, fetchCustomer360 } from './api';
import type { CustomerBasicInfo, Customer360Response } from './types';
import { Loader2, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('b1-customer360');
  const [customers, setCustomers] = useState<CustomerBasicInfo[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(100106);
  const [c360Data, setC360Data] = useState<Customer360Response | null>(null);
  
  const [loading360, setLoading360] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showEvidence, setShowEvidence] = useState<boolean>(false);

  const loadCustomers = useCallback(async () => {
    try {
      const list = await fetchCustomers();
      setCustomers(list);
      if (list.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(list[0].customer_id);
      }
    } catch (err: any) {
      setError('Failed to connect to DuckDB Backend API');
    }
  }, [selectedCustomerId]);

  const load360 = useCallback(async (id: number) => {
    try {
      setLoading360(true);
      setError(null);
      const data = await fetchCustomer360(id);
      setC360Data(data);
    } catch (err: any) {
      setError(`Failed to load data for Customer ID ${id}`);
    } finally {
      setLoading360(false);
    }
  }, []);

  // Load customer list on startup
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Fetch Customer 360 profile whenever selected customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      load360(selectedCustomerId);
    }
  }, [selectedCustomerId, load360]);

  // Handler when KYC document is verified dynamically
  const handleKycUpdated = () => {
    if (selectedCustomerId) {
      load360(selectedCustomerId);
      loadCustomers();
    }
  };

  const featuredCustomers = [100106, 100100, 100101, 100102, 100103];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <Header
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={(id) => setSelectedCustomerId(id)}
        onToggleEvidence={() => setShowEvidence(!showEvidence)}
        showEvidence={showEvidence}
        citationCount={c360Data?.citations?.length || 0}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Module Sidebar */}
        <Sidebar activeModule={activeModule} onSelectModule={setActiveModule} />

        {/* Dynamic Module Content View */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Demo Customer Pills Bar */}
          <div className="flex items-center justify-between bg-gray-900/60 border border-gray-800 p-3 rounded-xl">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-gray-300">Quick Interview Sample Customers:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {featuredCustomers.map((id) => (
                <button
                  key={id}
                  onClick={() => setSelectedCustomerId(id)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    selectedCustomerId === id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  Customer {id}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          {loading360 && (
            <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-sm text-gray-400 font-mono">Querying DuckDB database for Customer #{selectedCustomerId}...</p>
            </div>
          )}

          {/* Error Notice */}
          {error && !loading360 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <span>{error}</span>
              </div>
              <button 
                onClick={() => setSelectedCustomerId(selectedCustomerId || 100106)}
                className="px-3 py-1 bg-rose-900/40 hover:bg-rose-900/60 text-xs text-white rounded-lg flex items-center gap-1 font-mono"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Module View Renderer */}
          {!loading360 && (
            <>
              {activeModule === 'b1-customer360' && c360Data && (
                <Customer360
                  data={c360Data}
                  onOpenEvidence={() => setShowEvidence(true)}
                  onNavigateToKyc={() => setActiveModule('b2-kyc')}
                />
              )}
              {activeModule === 'b2-kyc' && (
                <KYCAssistant
                  customerId={selectedCustomerId}
                  onOpenEvidence={() => setShowEvidence(true)}
                  onKycUpdated={handleKycUpdated}
                />
              )}
              {activeModule === 'b3-faq' && (
                <FAQAssistant onOpenEvidence={() => setShowEvidence(true)} />
              )}
              {activeModule === 'b4-lookalike' && (
                <LookalikeExplainer
                  customerId={selectedCustomerId}
                  onOpenEvidence={() => setShowEvidence(true)}
                  onSelectCustomer={(id) => {
                    setSelectedCustomerId(id);
                    setActiveModule('b1-customer360');
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Record Citation Evidence Slide-Over Drawer */}
      <EvidenceDrawer
        isOpen={showEvidence}
        onClose={() => setShowEvidence(false)}
        citations={c360Data?.citations || []}
        customerId={selectedCustomerId}
      />
    </div>
  );
}

export default App;
