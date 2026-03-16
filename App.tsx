import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ReportView, { ThemeType } from './components/ReportView';
import StudentList from './components/StudentList';
import { StudentDataRow, ProcessedReportData, UserRole } from './types';
import { processExcelData, getAvailableUnits, CURRICULA } from './utils';

type AppView = 'upload' | 'list' | 'report';
export type TrendMetricType = 'accuracy' | 'passRate';

const STORAGE_KEYS = {
  UNIT_NAMES: 'xueqiu_custom_unit_names',
  ASSOCIATIONS: 'xueqiu_custom_associations',
  KP_COUNTS: 'xueqiu_custom_kp_counts',
  ERROR_COUNTS: 'xueqiu_custom_error_counts',
};

function App() {
  const [view, setView] = useState<AppView>('upload');
  const [role, setRole] = useState<UserRole>('counselor');
  const [rawData, setRawData] = useState<StudentDataRow[]>([]);
  const [reportData, setReportData] = useState<ProcessedReportData | null>(null);
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [availableUnits, setAvailableUnits] = useState<number[]>([]);
  const [unitRange, setUnitRange] = useState<{ min: number, max: number }>({ min: 1, max: 1 });
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('default');
  const [selectedCurriculumKey, setSelectedCurriculumKey] = useState<string>(Object.keys(CURRICULA)[0]);

  // Persistent report options
  const [isChartZoomed, setIsChartZoomed] = useState(false);
  const [trendMetric, setTrendMetric] = useState<TrendMetricType>('accuracy');
  
  // Custom metadata persisted in browser
  const [customUnitNames, setCustomUnitNames] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.UNIT_NAMES);
    return saved ? JSON.parse(saved) : [];
  });
  const [customAssociations, setCustomAssociations] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASSOCIATIONS);
    return saved ? JSON.parse(saved) : [];
  });
  const [customKPCounts, setCustomKPCounts] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.KP_COUNTS);
    return saved ? JSON.parse(saved) : [];
  });
  const [customErrorCounts, setCustomErrorCounts] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ERROR_COUNTS);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UNIT_NAMES, JSON.stringify(customUnitNames));
    localStorage.setItem(STORAGE_KEYS.ASSOCIATIONS, JSON.stringify(customAssociations));
    localStorage.setItem(STORAGE_KEYS.KP_COUNTS, JSON.stringify(customKPCounts));
    localStorage.setItem(STORAGE_KEYS.ERROR_COUNTS, JSON.stringify(customErrorCounts));
  }, [customUnitNames, customAssociations, customKPCounts, customErrorCounts]);

  const handleDataLoaded = (data: StudentDataRow[]) => {
    setRawData(data);
    setView('list');
  };

  const handleSelectStudent = (studentId: string) => {
    const units = getAvailableUnits(rawData, studentId);
    if (units.length === 0) return alert('该学生没有有效数据');

    const min = units[0];
    const max = units[units.length - 1];
    setAvailableUnits(units);
    setUnitRange({ min, max });
    setSelectedStudentId(studentId);

    const studentRow = rawData.find(r => String(r.user_id) === String(studentId));
    if (studentRow) {
      const studentGrade = studentRow.package_grade || '';
      const mappedGrade = studentGrade.toLowerCase().includes('one') ? '一年级' : 
                          studentGrade.toLowerCase().includes('two') ? '二年级' :
                          studentGrade.toLowerCase().includes('three') ? '三年级' :
                          studentGrade.toLowerCase().includes('four') ? '四年级' :
                          studentGrade.toLowerCase().includes('five') ? '五年级' :
                          studentGrade.toLowerCase().includes('six') ? '六年级' : '';
      
      if (mappedGrade && !selectedCurriculumKey.startsWith(mappedGrade)) {
        setSelectedCurriculumKey(mappedGrade);
      }
    }

    const processed = processExcelData(rawData, studentId, role, { min, max });
    if (processed) {
      setReportData(processed);
      setView('report');
    }
  };

  const handleSwitchStudentById = (userId: string | number) => {
    const student = rawData.find(r => String(r.user_id) === String(userId));
    if (student) {
      handleSelectStudent(String(student.user_id));
    } else {
      alert(`未找到 ID 为 ${userId} 的学员`);
    }
  };

  const handleUnitRangeChange = (min: number, max: number) => {
    if (!selectedStudentId) return;
    setUnitRange({ min, max });
    const processed = processExcelData(rawData, selectedStudentId, role, { min, max });
    if (processed) setReportData(processed);
  };

  const handleReset = () => {
    setRawData([]); setReportData(null); setSelectedStudentId(null); setView('upload');
  };

  return (
    <div className="min-h-screen pb-10 bg-slate-50 font-sans">
      <header className="bg-white border-b-4 border-indigo-100 py-4 mb-8 shadow-sm print:hidden">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="flex flex-col md:flex-row md:items-baseline gap-2">
                <h1 className="text-2xl font-black text-indigo-600 flex items-center gap-2 cursor-pointer" onClick={handleReset}>
                    🎓 学情反馈生成器
                </h1>
                <span className="text-xs font-bold text-slate-400">使用问题可留言sundong@xueqiulearning.com</span>
            </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        {view === 'upload' && (
          <FileUpload onDataLoaded={handleDataLoaded} role={role} onRoleChange={setRole} />
        )}
        {view === 'list' && (
          <StudentList data={rawData} onSelectStudent={handleSelectStudent} onReupload={handleReset} />
        )}
        {view === 'report' && reportData && (
          <ReportView 
            data={reportData} 
            rawData={rawData} 
            onReset={handleReset} 
            onBack={() => setView('list')} 
            availableUnits={availableUnits}
            currentRange={unitRange} 
            onRangeChange={handleUnitRangeChange}
            currentTheme={currentTheme} 
            onThemeChange={setCurrentTheme}
            selectedCurriculumKey={selectedCurriculumKey}
            setSelectedCurriculumKey={setSelectedCurriculumKey}
            onSwitchStudentById={handleSwitchStudentById}
            isChartZoomed={isChartZoomed}
            onToggleZoom={() => setIsChartZoomed(!isChartZoomed)}
            trendMetric={trendMetric}
            onToggleMetric={(m: TrendMetricType) => setTrendMetric(m)}
            customUnitNames={customUnitNames}
            onUpdateCustomUnitNames={setCustomUnitNames}
            customAssociations={customAssociations}
            onUpdateCustomAssociations={setCustomAssociations}
            customKPCounts={customKPCounts}
            onUpdateCustomKPCounts={setCustomKPCounts}
            customErrorCounts={customErrorCounts}
            onUpdateCustomErrorCounts={setCustomErrorCounts}
          />
        )}
      </main>
    </div>
  );
}

export default App;