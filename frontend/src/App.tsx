import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, type ModuleType } from './components/Sidebar';
import { Customer360 } from './pages/Customer360';
import { KYCAssistant } from './pages/KYCAssistant';
import { FAQAssistant } from './pages/FAQAssistant';
import { LookalikeExplainer } from './pages/LookalikeExplainer';
import { LoginPage } from './pages/LoginPage';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { fetchCustomers, fetchCustomer360, getCurrentUser, logoutUser } from './api';
import type { CustomerBasicInfo, Customer360Response, AuthUser } from './types';
import { Loader2, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem('itss_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('itss_token');
  });

  const [activeModule, setActiveModule] = useState<ModuleType>('b1-customer360');
  const [customers, setCustomers] = useState<CustomerBasicInfo[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(100106);
  const [c360Data, setC360Data] = useState<Customer360Response | null>(null);
  
  const [loading360, setLoading360] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showEvidence, setShowEvidence] = useState<boolean>(false);

  // Validate session token on mount
  useEffect(() => {
    if (token && !user) {
      getCurrentUser(token)
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('itss_user', JSON.stringify(userData));
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem('itss_token');
          localStorage.removeItem('itss_user');
        });
    }
  }, [token, user]);

  const handleLoginSuccess = (loggedInUser: AuthUser, authToken: string) => {
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem('itss_user', JSON.stringify(loggedInUser));
    localStorage.setItem('itss_token', authToken);
  };

  const handleLogout = async () => {
    if (token) {
      await logoutUser(token);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('itss_user');
    localStorage.removeItem('itss_token');
  };

  const loadCustomers = useCallback(async () => {
    try {
      const list = await fetchCustomers();
      setCustomers(list);
      if (list.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(list[0].customer_id);
      }
    } catch (err: any) {
      setError('Failed to connect to ITSS Bank Backend System');
    }
  }, [selectedCustomerId]);

  const load360 = useCallback(async (id: number) => {
    try {
      setLoading360(true);
      setError(null);
      const data = await fetchCustomer360(id);
      setC360Data(data);
    } catch (err: any) {
      setError(`Failed to load records for Customer ID ${id}`);
    } finally {
      setLoading360(false);
    }
  }, []);

  // Load customer list on startup
  useEffect(() => {
    if (user) {
      loadCustomers();
    }
  }, [loadCustomers, user]);

  // Fetch Customer 360 profile whenever selected customer changes
  useEffect(() => {
    if (user && selectedCustomerId) {
      load360(selectedCustomerId);
    }
  }, [selectedCustomerId, load360, user]);

  // Handler when KYC document is verified dynamically
  const handleKycUpdated = () => {
    if (selectedCustomerId) {
      load360(selectedCustomerId);
      loadCustomers();
    }
  };

  const featuredCustomers = [100106, 100100, 100101, 100102, 100103];

  if (!user || !token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <Header
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={(id) => setSelectedCustomerId(id)}
        onToggleEvidence={() => setShowEvidence(!showEvidence)}
        showEvidence={showEvidence}
        citationCount={c360Data?.citations?.length || 0}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Module Sidebar */}
        <Sidebar activeModule={activeModule} onSelectModule={setActiveModule} />

        {/* Dynamic Module Content View */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Demo Customer Pills Bar */}
          <div className="flex items-center justify-between bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-sm">
            <div className="flex items-center space-x-2 text-xs text-slate-600 font-mono">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-900">Select Customer Portfolio:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {featuredCustomers.map((id) => (
                <button
                  key={id}
                  onClick={() => setSelectedCustomerId(id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                    selectedCustomerId === id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  Customer {id}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          {loading360 && (
            <div className="card-modern p-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-slate-600 font-mono font-semibold">Retrieving ITSS Bank records for Customer #{selectedCustomerId}...</p>
            </div>
          )}

          {/* Error Notice */}
          {error && !loading360 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>{error}</span>
              </div>
              <button 
                onClick={() => setSelectedCustomerId(selectedCustomerId || 100106)}
                className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-1 font-mono font-bold"
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
                <FAQAssistant
                  selectedCustomerId={selectedCustomerId}
                  onOpenEvidence={() => setShowEvidence(true)}
                />
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
