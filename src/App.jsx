import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Layout from './components/Layout';
import { Suspense, lazy } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const VoicePrescription = lazy(() => import('./pages/VoicePrescription'));
const GRNStepper = lazy(() => import('./components/GRNStepper'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));
const PrescriptionView = lazy(() => import('./pages/PrescriptionView'));
const LoginTerminal = lazy(() => import('./pages/LoginTerminal'));
const MorningBriefing = lazy(() => import('./pages/MorningBriefing'));
const NurseStation = lazy(() => import('./pages/NurseStation'));
const Pharmacist = lazy(() => import('./pages/Pharmacist'));
const AccountingExceptions = lazy(() => import('./pages/AccountingExceptions'));
const ZohoConfig = lazy(() => import('./pages/ZohoConfig'));

import { useToast } from './hooks/useToast';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { getInventory, processInput, commitStock, uploadPDF, transcribeAudio, getDashboardStats, getSuppliers, getWardRequestsList, createWardRequest, updateWardRequestStatus, acknowledgeWardRequest, getShortageClaims, login as loginApi } from './services/api';
import MobileNav from './components/MobileNav';
import LowStockBanner from './components/LowStockBanner';
export const getMenuItems = (role) => {
  const commonMenus = [
    { id: 'morning_briefing', label: 'Dashboard', icon: 'dashboard', roles: ['admin'] },
    { id: 'pharmacist', label: 'Central Dispensing', icon: 'local_pharmacy', roles: ['pharmacist'] },
    { id: 'grn', label: 'Receive Inbound (GRN)', icon: 'add_box', roles: ['pharmacist'] },
    { id: 'nurse_station', label: 'Ward Station', icon: 'vaccines', roles: ['nurse'] },
    { id: 'prescription', label: 'Voice Rx', icon: 'mic', roles: ['nurse'] },
    { id: 'inventory', label: 'Inventory Master', icon: 'inventory_2', roles: ['admin', 'pharmacist'] },
    { id: 'suppliers', label: 'Suppliers', icon: 'local_shipping', roles: ['admin'] },
    { id: 'accounting', label: 'Sync Exceptions', icon: 'sync_problem', roles: ['admin'] },
  ];
  return commonMenus.filter(m => m.roles.includes(role));
};
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('auth') === 'true');
  const [currentUserRole, setCurrentUserRole] = useState(() => localStorage.getItem('role') || null);
  const getHash = () => window.location.hash.replace('#', '') || 'dashboard';
  const [activeTab, setActiveTabState] = useState(getHash());
  const setActiveTab = (tab) => {
    window.location.hash = tab;
    setActiveTabState(tab);
  };
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTabState(getHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const isRxView = window.location.pathname.startsWith('/view-rx/');
  if (isRxView) {
    return <PrescriptionView />;
  }
  const [inventory, setInventory] = useState([]);
  const [inputText, setInputText] = useState('');
  const [extractedItems, setExtractedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('CREDIT');
  const [shortageClaims, setShortageClaims] = useState([]);
  const { toasts, showToast } = useToast();
  const [wardRequests, setWardRequests] = useState([]);
  useEffect(() => {
    fetchData();
    checkDb();
    fetchStats();
    fetchSuppliers();
    fetchWardRequestsData();
    fetchShortageClaims();
  }, []);
  const fetchWardRequestsData = async () => {
    try {
      const res = await getWardRequestsList();
      if (res.success) setWardRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch ward requests:", err);
    }
  };
  const fetchSuppliers = async () => {
    try {
      const res = await getSuppliers();
      setSuppliers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  };
  const fetchStats = async () => {
    try {
      const res = await getDashboardStats();
      setDashboardStats(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    }
  };
  const fetchShortageClaims = async () => {
    try {
      const res = await getShortageClaims();
      if (res.success) setShortageClaims(res.data);
    } catch (err) {
      console.error("Failed to fetch shortage claims:", err);
    }
  };
  const checkDb = async () => {
    try {
      await getInventory();
    } catch (err) {
      console.error("Database check failed");
    }
  };
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getInventory();
      const items = res.data || [];
      setInventory(items);
      const lowStock = items.filter(item => (item.stock_quantity || 0) <= (item.min_stock_level || 10));
      setLowStockItems(lowStock);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };
  const handleProcessInput = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await processInput(inputText);
      const itemsData = res.items || res.data;
      if (itemsData && itemsData.length > 0) {
        setExtractedItems(itemsData.map(item => ({ ...item, original_qty: item.quantity })));
        setCurrentStep(2);
      } else {
        showToast("No pharmacy items found. Try: 'Add 50 Paracetamol strips, Batch A123'.", 'error');
      }
    } catch (err) {
      if (err.response?.data?.error === 'irrelevant_input') {
        showToast('Not inventory-related. Please speak about medicines or stock items.', 'error');
      } else {
        showToast('AI Processing failed. Please check your API key.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const res = await uploadPDF(file);
      const itemsData = res.items || res.data;
      if (itemsData && itemsData.length > 0) {
        setExtractedItems(itemsData.map(item => ({ ...item, original_qty: item.quantity })));
        setCurrentStep(2);
      } else {
        showToast('No pharmacy items could be extracted from this PDF.', 'error');
      }
    } catch (err) {
      console.error("Upload error:", err);
      const errMsg = err.response?.data?.error || 'PDF Upload failed.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };
  const { isRecording, startVoiceInput, stopVoiceInput, isProVoice, setIsProVoice } = useVoiceRecognition({ setInputText, setLoading, showToast });
  const handleCommit = async (vendorName) => {
    setCommitting(true);
    try {
      const shortageClaimsArr = extractedItems
        .filter(item => item.original_qty !== undefined && item.quantity < item.original_qty)
        .map(item => ({
          claimValue: (item.original_qty - item.quantity) * (item.rate || item.unit_price || 0)
        }));
      const selectedVendorId = vendorName || selectedVendor;
      const matchedSupplier = suppliers.find(s => String(s.id) === String(selectedVendorId));
      const grnData = {
        vendorName: matchedSupplier ? matchedSupplier.name : (selectedVendorId || 'Default Vendor'),
        vendor_id: matchedSupplier ? matchedSupplier.id : null,
        vendor_email: matchedSupplier?.email || null,
        items: extractedItems,
        invoiceNumber,
        invoiceDate,
        paymentMode,
        shortageClaims: shortageClaimsArr
      };
      await commitStock(grnData);
      showToast('Stock committed successfully!');
      setExtractedItems([]);
      setInputText('');
      setSelectedVendor('');
      setInvoiceNumber('');
      setInvoiceDate('');
      setPaymentMode('CREDIT');
      setCurrentStep(1);
      fetchData();
      fetchStats();
      fetchShortageClaims();
      setActiveTab('inventory');
      return true;
    } catch (err) {
      showToast('Failed to commit stock.', 'error');
      return false;
    } finally {
      setCommitting(false);
    }
  };
  const handleAddWardRequest = async (newRequest) => {
    try {
      await createWardRequest(newRequest);
      await fetchWardRequestsData(); 
    } catch (err) {
      console.error("Error creating ward request", err); ``
      setWardRequests([newRequest, ...wardRequests]);
    }
  };
  const handleFulfillWardRequest = async (requestId, fulfillQty, drugName) => {
    try {
      await updateWardRequestStatus(requestId, { status: 'in-transit', dispatch_time: new Date().toLocaleTimeString() });
      await fetchWardRequestsData(); 
      fetchStats(); 
    } catch (err) {
      console.error("Error fulfilling request", err);
    }
    setInventory(inventory.map(item => {
      if (item.name.toLowerCase() === drugName.toLowerCase() || item.name.includes(drugName)) {
        return { ...item, stock_quantity: Math.max(0, item.stock_quantity - fulfillQty) };
      }
      return item;
    }));
  };
  const handleAcknowledgeRequest = async (requestId) => {
    try {
      await acknowledgeWardRequest(requestId);
      await fetchWardRequestsData(); 
      fetchStats(); 
    } catch (err) {
      console.error("Error acknowledging request", err);
    }
  };
  const handleLogin = (user) => {
    setCurrentUserRole(user.role);
    setIsAuthenticated(true);
    localStorage.setItem('auth', 'true');
    localStorage.setItem('role', user.role);
    if (!window.location.hash) {
      if (user.role === 'admin') setActiveTab('morning_briefing');
      else if (user.role === 'nurse') setActiveTab('nurse_station');
      else if (user.role === 'pharmacist') setActiveTab('pharmacist');
    }
    fetchStats();
    fetchWardRequestsData();
    fetchShortageClaims();
  };
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUserRole(null);
    window.location.hash = '';
    localStorage.removeItem('auth');
    localStorage.removeItem('role');
  }
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard inventory={inventory} stats={dashboardStats} />;
      case 'morning_briefing':
        return <MorningBriefing inventory={inventory} stats={dashboardStats} wardRequests={wardRequests} shortageClaims={shortageClaims} onFulfillRequest={handleFulfillWardRequest} />;
      case 'nurse_station':
        return <NurseStation inventory={inventory} wardRequests={wardRequests} onAddRequest={handleAddWardRequest} onAcknowledge={handleAcknowledgeRequest} />;
      case 'pharmacist':
        return <Pharmacist inventory={inventory} wardRequests={wardRequests} onFulfillRequest={handleFulfillWardRequest} />;
      case 'inventory':
        return <Inventory inventory={inventory} fetchData={fetchData} />;
      case 'prescription':
        return <VoicePrescription />;
      case 'grn':
        return (
          <GRNStepper
            step={currentStep}
            setStep={setCurrentStep}
            inputText={inputText}
            setInputText={setInputText}
            handleProcessInput={handleProcessInput}
            handleFileUpload={handleFileUpload}
            startVoiceInput={startVoiceInput}
            stopVoiceInput={stopVoiceInput}
            isRecording={isRecording}
            extractedItems={extractedItems}
            setExtractedItems={setExtractedItems}
            handleCommit={handleCommit}
            loading={loading}
            committing={committing}
            selectedVendor={selectedVendor}
            setSelectedVendor={setSelectedVendor}
            suppliers={suppliers}
            invoiceNumber={invoiceNumber}
            setInvoiceNumber={setInvoiceNumber}
            invoiceDate={invoiceDate}
            setInvoiceDate={setInvoiceDate}
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            showToast={showToast}
          />
        );
      case 'suppliers':
        return <Suppliers />;
      case 'po':
        return <PurchaseOrders />;
      case 'accounting':
        return <AccountingExceptions showToast={showToast} />;
      case 'zoho_config':
        return <ZohoConfig showToast={showToast} />;
      default:
        return <Dashboard inventory={inventory} stats={dashboardStats} />;
    }
  };
  if (!isAuthenticated) {
    return <LoginTerminal onLogin={handleLogin} />;
  }
  return (
    <>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUserRole={currentUserRole} menuItems={getMenuItems(currentUserRole)} onLogout={handleLogout} />
      <Layout activeTab={activeTab}>
        {currentUserRole === 'admin' && activeTab !== 'nurse_station' && activeTab !== 'pharmacist' && (
          <LowStockBanner
            items={lowStockItems}
            onAction={() => setActiveTab('po')}
          />
        )}
        <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8 text-slate-400 animate-pulse"><span className="material-symbols-outlined mr-2 animate-spin">progress_activity</span> Loading module...</div>}>
          {renderContent()}
        </Suspense>
      </Layout>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} menuItems={getMenuItems(currentUserRole)} onLogout={handleLogout} />
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-sm shadow-lg text-sm font-semibold text-white animate-in slide-in-from-bottom-4 duration-300 min-w-[260px] ${t.type === 'error' ? 'bg-red-600'
              : t.type === 'zoho' ? 'bg-[#e65100]'
                : 'bg-emerald-600'
              }`}
          >
            <span className="material-symbols-outlined text-[18px] shrink-0">
              {t.type === 'error' ? 'error' : t.type === 'zoho' ? 'sync' : 'check_circle'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}
export default App;
