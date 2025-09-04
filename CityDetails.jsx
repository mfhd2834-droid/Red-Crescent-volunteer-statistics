import React, { useState } from 'react';
import { ArrowRight, Download, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import ExcelExporter from './components/ExcelExporter';
import OpportunityDetails from './components/OpportunityDetails';
import FileManager from './components/FileManager';

const CityDetails = ({ city, onBack, statisticsData, userRole, cityDetails }) => {
  const [showExportForm, setShowExportForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const categories = [
    { name: 'التوعية والتثقيف', color: '#007bff', key: 'awareness' },
    { name: 'التدريب والتطوير', color: '#28a745', key: 'training' },
    { name: 'زيارات', color: '#17a2b8', key: 'visits' },
    { name: 'السلال', color: '#795548', key: 'baskets' },
    { name: 'السعودية الخضراء', color: '#6f42c1', key: 'greenSaudi' },
    { name: 'الدعم الإسعافي', color: '#dc3545', key: 'medicalSupport' },
    { name: 'مساعدات', color: '#f8f9fa', key: 'assistance' },
    { name: 'التدريب والتطوير', color: '#343a40', key: 'trainingDev' },
    { name: 'التغطية الإسعافية', color: '#c82333', key: 'medicalCoverage' },
    { name: 'المحافظة على البيئة وإزالة التشوهات البصرية', color: '#ffc107', key: 'environment' },
    { name: 'تطوعي وظيفتي', color: '#6c757d', key: 'volunteerJob' },
    { name: 'الإعلام والنشر', color: '#0056b3', key: 'media' },
    { name: 'الحرفية', color: '#D2B48C', key: 'crafts' }
  ];

  // Check if there's data for this city
  const hasData = statisticsData && statisticsData.length > 0;
  
  // Generate data - use uploaded data if available, otherwise show empty state
  const generateData = () => {
    if (hasData) {
      // تحويل البيانات الفعلية إلى التنسيق المطلوب
      return statisticsData.map(item => ({
        name: item.name,
        value: item.value,
        color: getColorForCategory(item.name)
      }));
    }
    
    // Return empty data
    return categories.map(category => ({
      name: category.name,
      value: 0,
      color: category.color
    }));
  };

  // دالة لتحديد لون التصنيف
  const getColorForCategory = (categoryName) => {
    const categoryColors = {
      'الاداري‬‏': '#8B4513',      // بني
      '‫البيئة‬‏': '#28a745',       // أخضر
      'الإعلامي': '#007bff',     // أزرق
      '‫المجال الاسعافي‬‏': '#dc3545',     // أحمر
      '‫التعليم‬‏': '#ffc107',      // أصفر
      '‫المساعدات‬‏ ‫الانسانية‬‏': '#000000'      // أسود
    };
    
    return categoryColors[categoryName] || '#6c757d';
  };

  const data = generateData();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Generate monthly trend data (sample or empty)
  const monthlyData = hasData ? [
    { month: 'يناير', value: Math.floor(Math.random() * 500) + 200 },
    { month: 'فبراير', value: Math.floor(Math.random() * 500) + 200 },
    { month: 'مارس', value: Math.floor(Math.random() * 500) + 200 },
    { month: 'أبريل', value: Math.floor(Math.random() * 500) + 200 },
    { month: 'مايو', value: Math.floor(Math.random() * 500) + 200 },
    { month: 'يونيو', value: Math.floor(Math.random() * 500) + 200 },
    { month: 'يوليو', value: Math.floor(Math.random() * 500) + 200 }
  ] : [
    { month: 'يناير', value: 0 },
    { month: 'فبراير', value: 0 },
    { month: 'مارس', value: 0 },
    { month: 'أبريل', value: 0 },
    { month: 'مايو', value: 0 },
    { month: 'يونيو', value: 0 },
    { month: 'يوليو', value: 0 }
  ];

  const handleExportExcel = async () => {
    if (!selectedMonth || !selectedYear) {
      setExportStatus({ type: 'error', message: 'الرجاء تحديد الشهر والسنة للتصدير' });
      return;
    }

    setIsExporting(true);
    setExportStatus({ type: 'info', message: 'جاري تصدير ملف Excel...' });

    try {
      const response = await fetch(`/api/statistics/export_excel?month=${selectedMonth}&year=${selectedYear}&city=${encodeURIComponent(city)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'حدث خطأ في التصدير');
      }

      // تحميل الملف
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `statistics_${city}_${selectedYear}_${selectedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportStatus({ type: 'success', message: 'تم تصدير ملف Excel بنجاح!' });
      
      // إعادة تعيين النموذج
      setTimeout(() => {
        setSelectedMonth('');
        setSelectedYear('');
        setExportStatus(null);
        setShowExportForm(false);
      }, 2000);

    } catch (error) {
      setExportStatus({ type: 'error', message: error.message || 'حدث خطأ أثناء التصدير' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadExcel = () => {
    setShowExportForm(true);
  };

  // Initialize FileManager for city statistics deletion
  const fileManager = FileManager({
    onStatisticsUpdated: (updatedStatistics, lastUpdate) => {
      // Navigate back to dashboard after successful deletion
      onBack();
    }
  });

  const handleDeleteStatistics = async () => {
    const result = await fileManager.handleStatisticsDelete(city);
    if (result.success) {
      alert(result.message);
      onBack();
    } else {
      alert(result.message);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{`${label}`}</p>
          <p className="text-red-crescent">
            {`عدد المتطوعين: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Export Form Modal */}
      {showExportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                تحميل إحصائيات {city}
              </h3>
              <button
                onClick={() => setShowExportForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الشهر</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">اختر الشهر</option>
                  <option value="1">يناير</option>
                  <option value="2">فبراير</option>
                  <option value="3">مارس</option>
                  <option value="4">أبريل</option>
                  <option value="5">مايو</option>
                  <option value="6">يونيو</option>
                  <option value="7">يوليو</option>
                  <option value="8">أغسطس</option>
                  <option value="9">سبتمبر</option>
                  <option value="10">أكتوبر</option>
                  <option value="11">نوفمبر</option>
                  <option value="12">ديسمبر</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">السنة</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">اختر السنة</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>

              {exportStatus && (
                <div className={`p-3 rounded-lg ${
                  exportStatus.type === 'success' ? 'bg-green-50 text-green-700' :
                  exportStatus.type === 'error' ? 'bg-red-50 text-red-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {exportStatus.message}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleExportExcel}
                  disabled={isExporting || !selectedMonth || !selectedYear}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isExporting ? 'جاري التصدير...' : 'تحميل ملف Excel'}
                </Button>
                <Button
                  onClick={() => setShowExportForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center space-x-2 space-x-reverse"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة للصفحة الرئيسية</span>
        </Button>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">{city}</h1>
          <p className="text-gray-600">تفاصيل إحصائيات التطوع</p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          {/* Enhanced Excel Export - Available for all users */}
          {hasData && (
            <ExcelExporter 
              city={city}
              cityData={statisticsData}
              onExportComplete={() => {
                console.log('Export completed for', city);
              }}
            />
          )}
          
          {/* Quick Download Button */}
          <Button
            variant="outline"
            onClick={handleDownloadExcel}
            className="flex items-center space-x-2 space-x-reverse"
            disabled={!hasData}
          >
            <Download className="h-4 w-4" />
            <span>تحميل سريع</span>
          </Button>
          
          {/* Delete Button - Only for managers and admins */}
          {(userRole === 'manager' || userRole === 'tech_admin' || userRole === 'digital_admin') && hasData && (
            <Button
              variant="outline"
              onClick={handleDeleteStatistics}
              className="flex items-center space-x-2 space-x-reverse text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-4 w-4" />
              <span>حذف الإحصائيات</span>
            </Button>
          )}
        </div>
      </div>

      {!hasData ? (
        // Empty State
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ArrowRight className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            لا توجد إحصائيات لمدينة {city}
          </h2>
          <p className="text-gray-600 mb-4">
            لم يتم رفع أي ملفات إحصائية لهذه المدينة بعد.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-red-crescent mb-2">{total}</div>
                <div className="text-sm text-gray-600">إجمالي المتطوعين</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{data.filter(d => d.value > 0).length}</div>
                <div className="text-sm text-gray-600">التصنيفات النشطة</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {Math.max(...data.map(d => d.value))}
                </div>
                <div className="text-sm text-gray-600">أعلى تصنيف</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {total > 0 ? Math.round(total / data.filter(d => d.value > 0).length) : 0}
                </div>
                <div className="text-sm text-gray-600">المتوسط</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع المتطوعين حسب التصنيف</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px' }}
                        formatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>الاتجاه الشهري للتطوع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#E4002B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Statistics Table */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الإحصائيات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-3 font-semibold">التصنيف</th>
                      <th className="text-right p-3 font-semibold">عدد المتطوعين</th>
                      <th className="text-right p-3 font-semibold">النسبة المئوية</th>
                      <th className="text-right p-3 font-semibold">اللون</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data
                      .sort((a, b) => b.value - a.value)
                      .map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3">{item.name}</td>
                          <td className="p-3 font-medium">{item.value}</td>
                          <td className="p-3">{total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%</td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: item.color }}
                              ></div>
                              <span className="text-xs text-gray-500">{item.color}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Opportunities Details */}
          <OpportunityDetails cityDetails={cityDetails} city={city} />
        </>
      )}
    </div>
  );
};

export default CityDetails;