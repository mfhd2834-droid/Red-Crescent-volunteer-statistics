import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './Dashboard';
import CityDetails from './CityDetails';
import FileUpload from './FileUpload';
import UserManagement from './components/UserManagement';
import TechnicalIssues from './components/TechnicalIssues';
import Login from './components/Login';

// إصدار الموقع
const SITE_VERSION = 'SRCA 1.0';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCity, setSelectedCity] = useState(null);
  const [statisticsData, setStatisticsData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // تحميل الإحصائيات الحالية عند بدء التطبيق
  useEffect(() => {
    loadCurrentStatistics();
  }, []);

  const loadCurrentStatistics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/statistics/current');
      const result = await response.json();
      
      if (result.success && result.data) {
        setStatisticsData(result.data.data || {});
      }
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (email, role) => {
    // تحديد اسم المستخدم بناءً على الدور
    let userName = 'مستخدم';
    let roleName = 'مستكشف الإحصائيات';
    
    if (role === 'digital_admin') {
      userName ='WELLCOME';
      roleName = 'الإدارة الرقمية';
    } else if (role === 'tech_admin') {
      userName = 'WELLCOME ';
      roleName = 'الإداري التقني';
    } else if (role === 'manager') {
      userName = 'WELLCOME ';
      roleName = 'الإداري';
    } else {
      userName = email.split('@')[0];
      roleName = 'مستكشف الإحصائيات';
    }
    
    setCurrentUser({ name: userName, role: roleName, email: email });
    setUserRole(role);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserRole(null);
    setCurrentView('dashboard');
    setSelectedCity(null);
  };

  const handleCitySelect = (city, cityDetails) => {
    console.log('handleCitySelect called with:', city, cityDetails); // Debug log
    setSelectedCity({ name: city, details: cityDetails || [] });
    setCurrentView('cityDetails');
    console.log('View changed to cityDetails, selectedCity:', { name: city, details: cityDetails || [] }); // Debug log
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (view === 'dashboard') {
      setSelectedCity(null);
    }
  };

  const handleDataUpload = (newData) => {
    setStatisticsData(prevData => ({
      ...prevData,
      ...newData
    }));
    
    // Update last modified timestamp
    if (newData.lastUpdate || newData.uploadTimestamp) {
      // Force reload of current statistics to get updated timestamp
      loadCurrentStatistics();
    } else {
      // إعادة تحميل الإحصائيات بعد رفع البيانات
      loadCurrentStatistics();
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} version={SITE_VERSION} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={currentUser} onLogout={handleLogout} version={SITE_VERSION} />
      <div className="flex">
        <Sidebar 
          userRole={userRole} 
          currentView={currentView}
          onViewChange={handleViewChange}
        />
        <main className="flex-1 mr-72 mt-16 p-6">
          {currentView === 'dashboard' && (
            <Dashboard 
              onCitySelect={handleCitySelect} 
              statisticsData={statisticsData}
              userRole={userRole}
              isLoading={isLoading}
            />
          )}
          {currentView === 'cityDetails' && selectedCity && (
            <CityDetails 
              city={selectedCity.name} 
              onBack={() => handleViewChange("dashboard")}
              statisticsData={statisticsData[selectedCity.name] ? statisticsData[selectedCity.name].data : null}
              userRole={userRole}
              cityDetails={selectedCity.details}
            />
          )}
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-20 left-4 bg-black text-white p-2 rounded text-xs z-40">
              <div>Current View: {currentView}</div>
              <div>Selected City: {selectedCity ? selectedCity.name : 'None'}</div>
              <div>Statistics Data Keys: {Object.keys(statisticsData).join(', ')}</div>
            </div>
          )}
          {(currentView === 'fileUpload' && (userRole === 'manager' || userRole === 'tech_admin' || userRole === 'digital_admin')) && (
            <FileUpload onDataUpload={handleDataUpload} userRole={userRole} />
          )}
          {(currentView === 'technicalIssues' && (userRole === 'tech_admin' || userRole === 'digital_admin')) && (
            <TechnicalIssues userRole={userRole} />
          )}
          {(currentView === 'accounts' && userRole === 'digital_admin') && (
            <UserManagement />
          )}
        </main>
      </div>
      
      {/* شريط الإصدار في أسفل الصفحة */}
      <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white text-center py-1 text-sm z-50">
        {SITE_VERSION} - منصة الإحصائيات العامة لتطوع الهلال الأحمر - محافظة المدينة المنورة
      </div>
    </div>
  );
}

export default App;