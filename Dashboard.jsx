import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import CityCard from './components/CityCard';
import LastUpdateTracker from './components/LastUpdateTracker';

const Dashboard = ({ onCitySelect, statisticsData, userRole, isLoading }) => {
  const [currentStatistics, setCurrentStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Debug log to check if onCitySelect is received
  console.log('Dashboard onCitySelect:', onCitySelect);

  const cities = [
    'المدينة',
    'العلا', 
    'ينبع',
    'الحناكية',
    'مهد الذهب',
    'بدر',
    'خيبر',
    'وادي الفرع',
    'العيص'
  ];

  // ألوان التصنيفات الصحيحة
  const categoryColors = {
    'الاداري‬‏': '#8B4513',      // بني
    '‫البيئة‬‏': '#28a745',       // أخضر
    'الإعلامي': '#007bff',     // أزرق
    '‫المجال الاسعافي‬‏': '#dc3545',     // أحمر
    '‫التعليم‬‏': '#ffc107',      // أصفر
    '‫المساعدات‬‏ ‫الانسانية‬‏': '#000000'      // أسود
  };

  const loadCurrentStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/statistics/current');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCurrentStatistics(result.data);
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentStatistics();
  }, []);

  const getMonthName = (month) => {
    const months = {
      1: 'يناير', 2: 'فبراير', 3: 'مارس', 4: 'أبريل',
      5: 'مايو', 6: 'يونيو', 7: 'يوليو', 8: 'أغسطس',
      9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر'
    };
    return months[month] || month;
  };

  const getCityData = (city) => {
    // First check if we have data from props (statisticsData)
    if (statisticsData && statisticsData[city]) {
      const cityData = statisticsData[city];
      const categories = Array.isArray(cityData.data) ? cityData.data.map(item => ({
        name: item.name,
        value: item.value,
        color: categoryColors[item.name] || '#6c757d'
      })) : [];

      return { 
        totalVolunteers: cityData.totalVolunteers || 0, 
        categories, 
        details: cityData.details || [] 
      };
    }

    // Fallback to currentStatistics from API
    if (currentStatistics && currentStatistics.data && currentStatistics.data[city]) {
      const cityData = currentStatistics.data[city];
      const categories = cityData.data ? cityData.data.map(item => ({
        name: item.name,
        value: item.value,
        color: categoryColors[item.name] || '#6c757d'
      })) : [];

      return { 
        totalVolunteers: cityData.totalVolunteers || 0, 
        categories, 
        details: cityData.details || [] 
      };
    }

    // Return empty data if no data found
    return { totalVolunteers: 0, categories: [], details: [] };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  const hasData = currentStatistics && currentStatistics.data && Object.keys(currentStatistics.data).length > 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">الصفحة الرئيسية</h1>
        <p className="text-gray-600">إحصائيات التطوع في محافظة المدينة المنورة</p>
      </div>

      {/* شرح الألوان في الأعلى */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>شرح الألوان</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#8B4513' }}></div>
              <span className="text-sm">إداري</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#28a745' }}></div>
              <span className="text-sm">بيئة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#007bff' }}></div>
              <span className="text-sm">إعلامي</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#dc3545' }}></div>
              <span className="text-sm">إسعافي</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ffc107' }}></div>
              <span className="text-sm">تعليم</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#000000' }}></div>
              <span className="text-sm">إنساني</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl text-gray-600 mb-4">محافظة المدينة المنورة</h2>
        
      <LastUpdateTracker
        lastUpdate={currentStatistics?.upload_date || currentStatistics?.last_modified}
        totalVolunteers={currentStatistics?.total_volunteers}
        period={currentStatistics ? `${getMonthName(currentStatistics.month)} ${currentStatistics.year}` : null}
        isLoading={loading || isLoading}
      />

      {/* شبكة المدن */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cities.map((city) => {
          const cityData = getCityData(city);
          
          console.log(`City data for ${city}:`, cityData); // Debug log
          
          return (
            <CityCard
              key={city}
              city={city}
              cityData={cityData}
              onCitySelect={onCitySelect}
            />
          );
        })}
      </div>

      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات المدن</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cities.map(city => ({
                  name: city,
                  volunteers: getCityData(city).totalVolunteers
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="volunteers" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>توزيع المتطوعين</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={cities.map(city => ({
                      name: city,
                      value: getCityData(city).totalVolunteers
                    })).filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {cities.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#dc2626" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;