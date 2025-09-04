import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Upload, FileText, CheckCircle, AlertCircle, BarChart3, Trash2, Eye } from 'lucide-react';
import ExcelProcessor from './components/ExcelProcessor';
import DataPreview from './components/DataPreview';
import FileManager from './components/FileManager';

const FileUpload = ({ onDataUpload, user }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showFilesList, setShowFilesList] = useState(false);

  const cities = [
    'المدينة المنورة',
    'العلا', 
    'ينبع',
    'الحناكية',
    'مهد الذهب',
    'بدر',
    'خيبر',
    'وادي الفرع',
    'العيص'
  ];

  const categories = [
    'التوعية والتثقيف',
    'التدريب والتطوير',
    'زيارات',
    'السلال',
    'السعودية الخضراء',
    'الدعم الإسعافي',
    'مساعدات',
    'التغطية الإسعافية',
    'المحافظة على البيئة وإزالة التشوهات البصرية',
    'تطوعي وظيفتي',
    'الإعلام والنشر',
    'الحرفية'
  ];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        setUploadedFile(file);
        setAnalysisResults(null);
        setUploadStatus(null);
      } else {
        setUploadStatus({ type: 'error', message: 'يرجى رفع ملف Excel فقط (.xlsx أو .xls)' });
      }
    }
  };

  const analyzeExcelFile = async (file) => {
    // رفع الملف إلى الواجهة الخلفية للتحليل
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaded_by', user?.email || 'مجهول');

    try {
      const response = await fetch('/api/statistics/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'حدث خطأ في رفع الملف');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      throw new Error(`خطأ في التواصل مع الخادم: ${error.message}`);
    }
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      'التوعية والتثقيف': '#007bff',
      'التدريب والتطوير': '#28a745',
      'زيارات': '#17a2b8',
      'السلال': '#795548',
      'السعودية الخضراء': '#6f42c1',
      'الدعم الإسعافي': '#dc3545',
      'مساعدات': '#f8f9fa',
      'التغطية الإسعافية': '#c82333',
      'المحافظة على البيئة وإزالة التشوهات البصرية': '#ffc107',
      'تطوعي وظيفتي': '#6c757d',
      'الإعلام والنشر': '#0056b3',
      'الحرفية': '#D2B48C'
    };
    return colorMap[category] || '#6c757d';
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[monthNumber - 1] || 'غير محدد';
  };

  const handleAnalyzeFile = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setUploadStatus({ type: 'info', message: 'جاري تحليل الملف واستخلاص البيانات...' });
    
    try {
      // تحليل الملف واستخلاص البيانات
      const results = await analyzeExcelFile(uploadedFile);
      setAnalysisResults(results);
      
      setUploadStatus({ 
        type: 'success', 
        message: `تم تحليل الملف بنجاح! تم اكتشاف بيانات ${results.citiesCount} مدن لشهر ${getMonthName(results.detectedMonth)} ${results.detectedYear}` 
      });
      
    } catch (error) {
      setUploadStatus({ type: 'error', message: error.message || 'حدث خطأ أثناء تحليل الملف' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!analysisResults) return;

    setIsProcessing(true);
    
    try {
      // Confirm upload with timestamp tracking
      const uploadData = {
        ...analysisResults,
        uploadTimestamp: new Date().toISOString(),
        updateLastModified: true
      };

      const response = await fetch('/api/statistics/confirm-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'حدث خطأ أثناء تأكيد الرفع');
      }

      const result = await response.json();
      
      // Notify parent component with updated data including timestamp
      onDataUpload({
        ...analysisResults,
        lastUpdate: result.lastUpdate || new Date().toISOString(),
        uploadTimestamp: result.uploadTimestamp
      });
      
      setUploadStatus({ 
        type: 'success', 
        message: `تم رفع البيانات إلى المنصة بنجاح! تم حفظ إحصائيات ${analysisResults.citiesCount} مدن وتحديث آخر تعديل.` 
      });
      
      // تحديث قائمة الملفات المرفوعة
      loadUploadedFiles();
      
      // إعادة تعيين النموذج
      setTimeout(() => {
        setUploadedFile(null);
        setAnalysisResults(null);
        setUploadStatus(null);
        setIsProcessing(false);
      }, 2000);
      
    } catch (error) {
      setUploadStatus({ type: 'error', message: error.message || 'حدث خطأ أثناء رفع البيانات' });
      setIsProcessing(false);
    }
  };

  const loadUploadedFiles = async () => {
    try {
      const response = await fetch('/api/statistics/list');
      if (response.ok) {
        const result = await response.json();
        setUploadedFiles(result.data || []);
      }
    } catch (error) {
      console.error('خطأ في تحميل قائمة الملفات:', error);
    }
  };

  // Initialize FileManager
  const fileManager = FileManager({
    onFileDeleted: (fileId, fileName, deletedStatistics) => {
      setUploadStatus({ 
        type: 'success', 
        message: `تم حذف الملف "${fileName}" وجميع الإحصائيات المرتبطة به بنجاح. تم تحديث آخر تعديل.` 
      });
      loadUploadedFiles();
    },
    onStatisticsUpdated: (updatedStatistics, lastUpdate) => {
      // Refresh parent component data with updated timestamp
      if (onDataUpload) {
        onDataUpload({
          ...updatedStatistics,
          lastUpdate: lastUpdate || new Date().toISOString()
        });
      }
    }
  });

  const deleteFile = async (fileId, fileName) => {
    const result = await fileManager.handleFileDelete(fileId, fileName, []);
    if (result.success) {
      setUploadStatus({ type: 'success', message: result.message });
      loadUploadedFiles();
      // Refresh parent component data
      if (onDataUpload) {
        onDataUpload({
          lastUpdate: result.lastUpdate || new Date().toISOString()
        });
      }
    } else {
      setUploadStatus({ type: 'error', message: result.message });
    }
  };

  // تحميل قائمة الملفات عند تحميل المكون
  React.useEffect(() => {
    loadUploadedFiles();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">رفع ملفات الإحصائيات</h1>
        <p className="text-gray-600">رفع ملفات Excel مع التحليل التلقائي للبيانات والمعلومات</p>
      </div>

      <div className="flex gap-4 mb-6">
        <Button
          onClick={() => setShowFilesList(false)}
          variant={!showFilesList ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          رفع ملف جديد
        </Button>
        <Button
          onClick={() => {
            setShowFilesList(true);
            loadUploadedFiles();
          }}
          variant={showFilesList ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          عرض الملفات المرفوعة ({uploadedFiles.length})
        </Button>
      </div>

      {!showFilesList ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-red-crescent" />
              <span>رفع ملف Excel جديد</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">اختر ملف Excel للرفع</p>
                <p className="text-sm text-gray-500">يدعم الملفات من نوع .xlsx و .xls فقط</p>
              </label>
            </div>

            {uploadedFile && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">{uploadedFile.name}</p>
                      <p className="text-sm text-blue-600">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleAnalyzeFile}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? 'جاري التحليل...' : 'تحليل الملف واستخلاص البيانات'}
                  </Button>
                </div>
              </div>
            )}

            {uploadStatus && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                uploadStatus.type === 'success' ? 'bg-green-50 text-green-800' :
                uploadStatus.type === 'error' ? 'bg-red-50 text-red-800' :
                'bg-blue-50 text-blue-800'
              }`}>
                {uploadStatus.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : uploadStatus.type === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                )}
                <span>{uploadStatus.message}</span>
              </div>
            )}

            {analysisResults && (
              <Card className="bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <span>نتائج التحليل التلقائي</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <div className="text-sm text-gray-600">عدد المدن المكتشفة</div>
                      <div className="text-lg font-semibold text-red-crescent">{analysisResults.citiesCount} مدن</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <div className="text-sm text-gray-600">الفترة الزمنية</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {getMonthName(analysisResults.detectedMonth)} {analysisResults.detectedYear}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <div className="text-sm text-gray-600">إجمالي المتطوعين</div>
                      <div className="text-lg font-semibold text-green-600">{analysisResults.totalVolunteersAllCities}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <div className="text-sm text-gray-600">التصنيفات المكتشفة</div>
                      <div className="text-lg font-semibold text-purple-600">{analysisResults.totalCategoriesFound}</div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">تفاصيل المدن والإحصائيات:</h4>
                    <div className="space-y-4">
                      {Object.entries(analysisResults.allCitiesData).map(([cityName, cityInfo]) => (
                        <div key={cityName} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="font-semibold text-red-crescent">{cityName}</h5>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">{cityInfo.totalVolunteers} متطوع</span>
                              <span className="mx-2">•</span>
                              <span>{cityInfo.categoriesFound} تصنيف</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                            {cityInfo.data.filter(item => item.value > 0).slice(0, 6).map((item, index) => (
                              <div key={index} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded">
                                <span className="truncate">{item.name}</span>
                                <span className="font-medium text-gray-700 ml-2">{item.value}</span>
                              </div>
                            ))}
                            {cityInfo.data.filter(item => item.value > 0).length > 6 && (
                              <div className="text-center text-gray-500 text-xs">
                                +{cityInfo.data.filter(item => item.value > 0).length - 6} تصنيفات أخرى
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleConfirmUpload}
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? 'جاري الرفع...' : 'تأكيد رفع البيانات إلى المنصة'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <span>الملفات المرفوعة ({uploadedFiles.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>لا توجد ملفات مرفوعة بعد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-800">{file.filename}</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">تاريخ الرفع:</span>
                            <br />
                            {new Date(file.upload_date).toLocaleDateString('ar-SA')}
                          </div>
                          <div>
                            <span className="font-medium">الفترة:</span>
                            <br />
                            {getMonthName(file.month)} {file.year}
                          </div>
                          <div>
                            <span className="font-medium">المدن:</span>
                            <br />
                            {file.cities_count} مدن
                          </div>
                          <div>
                            <span className="font-medium">المتطوعين:</span>
                            <br />
                            {file.total_volunteers} متطوع
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          رفع بواسطة: {file.uploaded_by} • المعرف: {file.checksum}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteFile(file.id, file.filename)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          title={`حذف الملف ${file.filename}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">تعليمات الاستخدام:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• قم برفع ملف Excel يحتوي على إحصائيات جميع مدن محافظة المدينة المنورة</li>
          <li>• سيتم تحليل الملف تلقائياً واستخلاص أسماء المدن والتواريخ والتصنيفات</li>
          <li>• راجع نتائج التحليل قبل تأكيد رفع البيانات إلى المنصة</li>
          <li>• يمكنك عرض وإدارة جميع الملفات المرفوعة من خلال تبويب "عرض الملفات المرفوعة"</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;