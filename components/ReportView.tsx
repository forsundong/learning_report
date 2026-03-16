
import React, { useRef, useMemo, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { ProcessedReportData, StudentDataRow, UnitData, Badge } from '../types';
import { formatDuration, parseRate, CURRICULA } from '../utils';
import ReportChart from './ReportChart';
import { 
  ArrowLeft, Filter, Download, User, Trophy, Target, BarChart2, Lightbulb, 
  Clock, BookOpen, Star, MessageCircleHeart, Palette, Rocket, Sparkles, Zap, 
  Crown, ListOrdered, AlertCircle, Book, Search, Maximize2, Minimize2, Edit3, X, Check, Info, TrendingUp,
  Brain, Copy, Image as ImageIcon, Save
} from 'lucide-react';
import { TrendMetricType } from '../App';

export type ThemeType = 'default' | 'boy' | 'girl';

interface ThemeConfig {
  id: ThemeType; label: string; icon: React.ReactNode;
  containerClass: string; cardClass: string; headerClass: string;
  showPattern: boolean; backgroundPattern?: string;
  colors: {
    bgMain: string; textMain: string; textMuted: string;
    headerBg: string; headerText: string; primary: string; secondary: string;
    border: string; profileBg: string; badgesBg: string; statsBg: string;
    chartBg: string; tableHeader: string; teacherSection: string;
    rankingHeaderBg: string; rankingHighlightRow: string; rankingBannerBg: string;
    rankingBannerText: string;
  }
}

const themes: Record<ThemeType, ThemeConfig> = {
  default: {
    id: 'default', label: '经典暖阳', icon: <Star className="w-4 h-4" />,
    containerClass: "rounded-[3.5rem] border-[6px] shadow-2xl",
    cardClass: "rounded-[2rem] border-2 shadow-sm", headerClass: "border-b-4",
    showPattern: true, backgroundPattern: "https://www.transparenttextures.com/patterns/confetti.png",
    colors: {
      bgMain: "bg-white", textMain: "text-stone-700", textMuted: "text-stone-400",
      headerBg: "bg-[#FFF8E1]", headerText: "text-amber-800",
      primary: "bg-amber-400 hover:bg-amber-500 text-white shadow-[0_4px_0_#d97706]",
      secondary: "bg-white border-2 border-stone-200 text-stone-400 hover:border-red-200 hover:text-red-500",
      border: "border-amber-100", profileBg: "bg-sky-50", badgesBg: "bg-[#fffbf0]",
      statsBg: "bg-stone-50", chartBg: "bg-[#fffaf5]", tableHeader: "bg-stone-50 text-stone-500",
      teacherSection: "bg-sky-50 border-amber-100", rankingHeaderBg: "bg-blue-50 border-blue-100",
      rankingHighlightRow: "bg-amber-50", rankingBannerBg: "bg-[#ff8a80]", rankingBannerText: "text-white"
    }
  },
  boy: {
    id: 'boy', label: '星际探索', icon: <Rocket className="w-4 h-4" />,
    containerClass: "rounded-[3rem] border-[5px] shadow-[0_10px_50px_rgba(59,130,246,0.15)]",
    cardClass: "rounded-[2.5rem] border-2 border-b-4", headerClass: "border-b-4 border-blue-900/10",
    showPattern: true, backgroundPattern: "https://www.transparenttextures.com/patterns/cubes.png",
    colors: {
      bgMain: "bg-slate-50", textMain: "text-slate-800", textMuted: "text-slate-400",
      headerBg: "bg-blue-100", headerText: "text-blue-900",
      primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_0_#1e3a8a]",
      secondary: "bg-white border-2 border-slate-300 text-slate-500 hover:border-blue-500 hover:text-blue-600",
      border: "border-blue-200", profileBg: "bg-white", badgesBg: "bg-gradient-to-br from-blue-50 to-slate-100",
      statsBg: "bg-slate-100", chartBg: "bg-white", tableHeader: "bg-slate-200 text-slate-600 uppercase tracking-wider",
      teacherSection: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none",
      rankingHeaderBg: "bg-blue-100 border-blue-200", rankingHighlightRow: "bg-blue-50", rankingBannerBg: "bg-blue-500", rankingBannerText: "text-white"
    }
  },
  girl: {
    id: 'girl', label: '梦幻云朵', icon: <Sparkles className="w-4 h-4" />,
    containerClass: "rounded-[4rem] border-[8px] border-double shadow-2xl ring-8 ring-rose-50",
    cardClass: "rounded-[2.5rem] border-2 border-dashed shadow-[4px_4px_0px_rgba(253,164,175,0.3)]",
    headerClass: "border-b-[3px] border-dashed",
    showPattern: true, backgroundPattern: "https://www.transparenttextures.com/patterns/hearts.png",
    colors: {
      bgMain: "bg-[#fffcfd]", textMain: "text-stone-600", textMuted: "text-rose-200",
      headerBg: "bg-rose-50", headerText: "text-stone-700",
      primary: "bg-rose-200 hover:bg-rose-300 text-stone-700 shadow-[0_4px_0_#fda4af]",
      secondary: "bg-white/80 border-2 border-rose-100 text-rose-300 hover:bg-white",
      border: "border-rose-100", profileBg: "bg-white/60 backdrop-blur-sm",
      badgesBg: "bg-gradient-to-b from-rose-50/20 to-white/50", statsBg: "bg-rose-50/40",
      chartBg: "bg-white/60", tableHeader: "bg-rose-50 text-rose-300",
      teacherSection: "bg-stone-50 border-rose-100", rankingHeaderBg: "bg-stone-50 border-stone-100",
      rankingHighlightRow: "bg-rose-50", rankingBannerBg: "bg-stone-400", rankingBannerText: "text-white"
    }
  }
};

const calculateRankings = (allRows: StudentDataRow[], range: { min: number, max: number }, role: string, currentStudentId: string | number) => {
    const studentMap = new Map<string, { name: string, accuracies: Record<number, number>, totalScore: number, avgAccuracy: number, count: number, finishedCount: number, rowCount: number, id: any }>();
    
    allRows.forEach(r => {
        const isHT = role === 'headteacher';
        const unitSeq = parseInt(String(r.level_sequence), 10);
        const lessonSeq = parseInt(String(r.unit_sequence), 10);
        
        if (isHT) { 
          if (unitSeq !== range.max) return; 
        } else { 
          if (isNaN(unitSeq) || unitSeq < range.min || unitSeq > range.max) return; 
        }
        
        const userIdStr = String(r.user_id);
        if (!studentMap.has(userIdStr)) { 
          studentMap.set(userIdStr, { name: r.real_name, accuracies: {}, totalScore: 0, avgAccuracy: 0, count: 0, finishedCount: 0, rowCount: 0, id: r.user_id }); 
        }
        
        const e = studentMap.get(userIdStr)!;
        const rate = parseRate(r.answer_right_rate);
        e.accuracies[lessonSeq] = rate;
        
        e.rowCount++;
        if (r.unit_finish_status === '完课') {
          e.finishedCount++;
        }
    });

    const res = Array.from(studentMap.values()).map((v) => {
        let totalScoreHT = 0; let totalCounselorAcc = 0; let countCounselor = 0;
        if (role === 'headteacher') { 
          [0, 1, 2, 3, 4, 5].forEach(l => { if (v.accuracies[l] !== undefined) totalScoreHT += v.accuracies[l]; }); 
        } else {
          Object.values(v.accuracies).forEach(val => { totalCounselorAcc += val; countCounselor++; });
        }
        
        const completionRate = v.rowCount > 0 ? (v.finishedCount / v.rowCount) * 100 : 0;
        
        return { 
          name: v.name, userId: String(v.id), accuracies: v.accuracies, totalScore: Math.round(totalScoreHT), 
          avgAccuracy: countCounselor > 0 ? totalCounselorAcc / countCounselor : 0, 
          completionRate, rank: 0 
        };
    });

    if (role === 'headteacher') { 
      res.sort((a, b) => b.totalScore - a.totalScore); 
    } else { 
      res.sort((a, b) => {
        if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
        if (a.userId === String(currentStudentId)) return -1;
        if (b.userId === String(currentStudentId)) return 1;
        return b.avgAccuracy - a.avgAccuracy;
      });
    }
    
    res.forEach((r, i) => r.rank = i + 1);
    return { rankings: res, total: res.length };
};

const rankingLessonCols = [0, 1, 2, 3, 4, 5];

interface ReportViewProps {
  data: ProcessedReportData;
  rawData: StudentDataRow[];
  onBack: () => void;
  onReset: () => void;
  availableUnits: number[];
  currentRange: { min: number; max: number };
  onRangeChange: (min: number, max: number) => void;
  currentTheme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  selectedCurriculumKey: string;
  setSelectedCurriculumKey: (key: string) => void;
  onSwitchStudentById: (id: string | number) => void;
  isChartZoomed: boolean;
  onToggleZoom: () => void;
  trendMetric: TrendMetricType;
  onToggleMetric: (m: TrendMetricType) => void;
  customUnitNames: string[];
  onUpdateCustomUnitNames: (names: string[]) => void;
  customAssociations: string[];
  onUpdateCustomAssociations: (assocs: string[]) => void;
  customKPCounts: string[];
  onUpdateCustomKPCounts: (counts: string[]) => void;
  customErrorCounts: string[];
  onUpdateCustomErrorCounts: (counts: string[]) => void;
}

const ReportView: React.FC<ReportViewProps> = ({ 
    data, rawData, onBack, availableUnits, currentRange, onRangeChange, 
    currentTheme, onThemeChange, selectedCurriculumKey, setSelectedCurriculumKey, onSwitchStudentById,
    isChartZoomed, onToggleZoom, trendMetric, onToggleMetric,
    customUnitNames, onUpdateCustomUnitNames,
    customAssociations, onUpdateCustomAssociations,
    customKPCounts, onUpdateCustomKPCounts,
    customErrorCounts, onUpdateCustomErrorCounts
}) => {
  const t = themes[currentTheme];
  const c = t.colors;
  const isHT = data.role === 'headteacher';
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [idSearchTerm, setIdSearchTerm] = useState('');
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [tempUnitNames, setTempUnitNames] = useState(customUnitNames.join('\n'));
  const [tempAssociations, setTempAssociations] = useState(customAssociations.join('\n'));
  const [tempKPCounts, setTempKPCounts] = useState(customKPCounts.join('\n'));
  const [tempErrorCounts, setTempErrorCounts] = useState(customErrorCounts.join('\n'));
  
  const currentCurriculum = CURRICULA[selectedCurriculumKey] || [];
  const { rankings, total } = useMemo(() => calculateRankings(rawData, currentRange, data.role, data.studentId), [rawData, currentRange, data.role, data.studentId]);
  const myRank = rankings.find(r => r.userId === String(data.studentId));
  const displayedRanks = useMemo(() => {
      const idx = rankings.findIndex(r => r.userId === String(data.studentId));
      return idx === -1 ? [] : rankings.slice(Math.max(0, idx - 5), Math.min(rankings.length, idx + 6));
  }, [rankings, data.studentId]);

  const handleSaveMetadata = () => {
    onUpdateCustomUnitNames(tempUnitNames.split('\n').map((l: string) => l.trim()));
    if (!isHT) {
      onUpdateCustomAssociations(tempAssociations.split('\n').map((l: string) => l.trim()));
      onUpdateCustomKPCounts(tempKPCounts.split('\n').map((l: string) => l.trim()));
      onUpdateCustomErrorCounts(tempErrorCounts.split('\n').map((l: string) => l.trim()));
    }
    setIsEditingMetadata(false);
  };

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    setIsCapturing(true);
    
    try {
      const options = {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: currentTheme === 'boy' ? '#f8fafc' : '#ffffff',
        style: { width: '1200px', maxWidth: '1200px', margin: '0', padding: '0', transform: 'none' },
        preferredFontFormat: 'woff2',
      };
      const dataUrl = await htmlToImage.toPng(reportRef.current, options);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        alert('报告图片已完美生成并复制到剪贴板！');
      } catch (copyErr) {
        const link = document.createElement('a');
        link.download = `${data.studentName}_学情报告.png`;
        link.href = dataUrl;
        link.click();
        alert('已成功生成图片并开始下载。');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('截图生成失败。请重试。');
    } finally {
      setIsCapturing(false);
    }
  };

  const getLessonName = (uNum: number) => {
    if (uNum === 0) return '课前测';
    const custom = customUnitNames[uNum - 1];
    if (custom && custom.trim()) return custom;
    if (isHT && uNum >= 1 && uNum <= 5) return currentCurriculum[uNum - 1] || `第${uNum}讲`;
    return isHT ? `第${uNum}讲` : `第${uNum}单元`;
  };

  const getAssociation = (uNum: number) => { if (isHT || uNum === 0) return ''; return customAssociations[uNum - 1] || ''; };

  const tableUnits = useMemo(() => {
      return data.units.map((u: UnitData) => {
          const uName = getLessonName(u.unitNumber);
          const finalAnalysis = u.status === 'low' ? `【${uName}】等你挑战` : u.analysis;
          return { ...u, unitName: uName, association: getAssociation(u.unitNumber), analysis: finalAnalysis };
      });
  }, [data.units, isHT, currentCurriculum, customUnitNames, customAssociations]);

  const monthlySummary = useMemo(() => {
    if (isHT || tableUnits.length !== 4) return null;
    let totalKPs = 0, totalErrors = 0; const highPerformers: string[] = [], lowPerformers: string[] = [];
    tableUnits.forEach((u: any) => {
      const idx = u.unitNumber - 1; 
      totalKPs += parseInt(customKPCounts[idx] || '0'); 
      totalErrors += parseInt(customErrorCounts[idx] || '0');
      if (u.accuracy > u.classAccuracy) highPerformers.push(u.unitName); else lowPerformers.push(u.unitName);
    });
    return { totalKPs, totalErrors, totalMinutes: Math.ceil(data.totalTimeSeconds / 60), highPerformersJoined: highPerformers.join('、'), lowPerformersJoined: lowPerformers.join('、') };
  }, [isHT, tableUnits, customKPCounts, customErrorCounts, data.totalTimeSeconds]);

  const renderAssociationBadge = (text: string) => {
    if (!text) return null;
    const isHighFreq = text.includes('高频'), isFocus = text.includes('重点'), isExtension = text.includes('拓展') || text.includes('思维');
    const baseClass = "flex items-center justify-center px-3 h-6 rounded-lg border text-[10px] font-black leading-none whitespace-nowrap";
    if (isHighFreq) return <span className={`${baseClass} bg-rose-50 text-rose-500 border-rose-200 shadow-[2px_2px_0_rgba(244,63,94,0.1)]`}>🔥 {text}</span>;
    if (isFocus) return <span className={`${baseClass} bg-indigo-50 text-indigo-500 border-indigo-100`}>{text}</span>;
    if (isExtension) return <span className={`${baseClass} bg-emerald-50 text-emerald-500 border-emerald-100`}>💡 {text}</span>;
    return <span className={`${baseClass} bg-slate-50 text-slate-400 border-slate-100`}>{text}</span>;
  };

  const getRankComment = () => {
    if (!myRank) return "继续努力，争取更好的成绩！";
    const { rank } = myRank; const ratio = rank / (total || 1);
    if (rank === 1) return "独占鳌头！你是全班最闪亮的学习明星，展现了非凡的掌握力！";
    if (rank <= 3) return "名列前茅！优秀的学习习惯是你成功的基石，保持这份冲劲！";
    if (ratio <= 0.2) return "表现优异！已进入班级第一梯队，继续保持稳健的步伐，冲刺巅峰！";
    if (ratio <= 0.5) return "进步显著！你正走在稳步提升的阶梯上，离尖子生行列仅一步之遥！";
    return "潜力无限！保持专注与耐心，每一份汗水都会在未来的考试中开出灿烂之花！";
  };

  return (
    <div className={`max-w-6xl mx-auto my-6 font-sans ${c.textMain}`}>
      {/* Controls Bar */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center px-4 gap-4 print:hidden">
        <div className="flex gap-3 items-center">
            <button onClick={onBack} className="bg-white px-6 py-2.5 rounded-full border-2 border-slate-100 shadow-sm font-black flex items-center gap-2 transition-all hover:scale-105 active:scale-95"><ArrowLeft className="w-5 h-5"/>列表</button>
            <form onSubmit={(e) => { e.preventDefault(); onSwitchStudentById(idSearchTerm); setIdSearchTerm(''); }} className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-400 transition-colors" />
                <input type="text" value={idSearchTerm} onChange={e => setIdSearchTerm(e.target.value)} placeholder="ID切换" className="bg-white pl-10 pr-4 py-2.5 rounded-full border-2 border-slate-100 shadow-sm outline-none focus:border-indigo-100 font-bold text-sm w-32"/>
            </form>
        </div>
        <div className="flex flex-wrap gap-3 items-center justify-center">
            <button onClick={() => setIsEditingMetadata(true)} className={`bg-white px-4 py-2 rounded-full border-2 shadow-sm font-black text-xs flex items-center gap-2 transition-all border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-600`}>
              <Edit3 className="w-4 h-4" /> 设置课程信息
            </button>
            <div className="bg-white p-1 rounded-full border-2 border-slate-100 shadow-sm flex">
                {(Object.keys(themes) as ThemeType[]).map(k => (
                    <button key={k} onClick={() => onThemeChange(k)} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${currentTheme === k ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400'}`}>{themes[k].label}</button>
                ))}
            </div>
            {!isHT && <div className="bg-white px-4 py-2 rounded-full border-2 border-slate-100 shadow-sm flex items-center gap-2"><Filter className="w-4 h-4 text-slate-300"/><select value={currentRange.min} onChange={e => onRangeChange(parseInt(e.target.value), currentRange.max)} className="bg-transparent font-black text-sm outline-none cursor-pointer">{availableUnits.map((u: number) => <option key={`min-${u}`} value={u}>第{u}单元</option>)}</select><span className="text-slate-200">~</span><select value={currentRange.max} onChange={e => onRangeChange(currentRange.min, parseInt(e.target.value))} className="bg-transparent font-black text-sm outline-none cursor-pointer">{availableUnits.map((u: number) => <option key={`max-${u}`} value={u}>第{u}单元</option>)}</select></div>}
            <button onClick={handleExportImage} disabled={isCapturing} className={`px-8 py-2.5 rounded-full font-black flex items-center gap-2 transition-all active:translate-y-1 ${isCapturing ? 'opacity-50 cursor-not-allowed' : ''} ${c.primary}`}>
              {isCapturing ? <Clock className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-5 h-5"/>}
              {isCapturing ? '正在生成...' : '1:1 精准导出'}
            </button>
        </div>
      </div>

      {/* Metadata Editing Modal */}
      {isEditingMetadata && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border-8 border-indigo-50 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b-4 border-indigo-50 flex justify-between items-center bg-indigo-50/30">
              <div>
                <h3 className="text-2xl font-black text-indigo-900">课程元数据设置</h3>
                <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Metadata Configuration</p>
              </div>
              <button onClick={() => setIsEditingMetadata(false)} className="p-2 hover:bg-rose-50 rounded-full transition-colors text-slate-300 hover:text-rose-500"><X className="w-8 h-8"/></button>
            </div>
            
            <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-indigo-400 flex items-center gap-2"><Book className="w-4 h-4"/> 单元/讲 名称 (每行一个)</label>
                <textarea 
                  value={tempUnitNames} 
                  onChange={e => setTempUnitNames(e.target.value)}
                  placeholder="第1单元&#10;第2单元&#10;..."
                  className="w-full h-48 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 font-bold text-sm focus:border-indigo-200 outline-none transition-all resize-none"
                />
              </div>

              {!isHT && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-rose-400 flex items-center gap-2"><Zap className="w-4 h-4"/> 学习关联/标签 (每行一个)</label>
                    <textarea 
                      value={tempAssociations} 
                      onChange={e => setTempAssociations(e.target.value)}
                      placeholder="高频易错&#10;思维拓展&#10;..."
                      className="w-full h-48 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 font-bold text-sm focus:border-rose-200 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-emerald-400 flex items-center gap-2"><Target className="w-4 h-4"/> 知识点总数 (里程碑统计)</label>
                    <textarea 
                      value={tempKPCounts} 
                      onChange={e => setTempKPCounts(e.target.value)}
                      placeholder="12&#10;15&#10;..."
                      className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 font-bold text-sm focus:border-emerald-200 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-amber-400 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> 易错点总数 (里程碑统计)</label>
                    <textarea 
                      value={tempErrorCounts} 
                      onChange={e => setTempErrorCounts(e.target.value)}
                      placeholder="3&#10;5&#10;..."
                      className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 font-bold text-sm focus:border-amber-200 outline-none transition-all resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-8 border-t-4 border-indigo-50 bg-slate-50/50 flex justify-end gap-4">
              <button 
                onClick={() => setIsEditingMetadata(false)}
                className="px-8 py-3 rounded-2xl font-black text-slate-400 hover:bg-slate-100 transition-all"
              >
                取消修改
              </button>
              <button 
                onClick={handleSaveMetadata}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-2xl font-black shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95"
              >
                <Save className="w-5 h-5"/> 保存配置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Report Container */}
      <div ref={reportRef} id="report-container-main" className={`${c.bgMain} ${t.containerClass} ${c.border} overflow-hidden relative print:shadow-none print:border-none print:rounded-none transition-all duration-700 mx-auto print:w-full`}>
        {/* Header */}
        <div className={`${c.headerBg} py-12 text-center relative border-b-4 ${c.border}`}>
            <h1 className={`text-4xl font-black ${c.headerText} tracking-tight drop-shadow-sm flex items-center justify-center gap-3 leading-tight`}>
                {currentTheme === 'boy' ? <Rocket className="w-10 h-10 animate-pulse"/> : <Crown className="w-10 h-10 text-yellow-300 fill-current"/>}
                {data.studentName} {isHT ? `专属学习报告` : `${currentRange.min}-${currentRange.max}单元 学习报告`}
            </h1>
        </div>

        {/* Profile & Badges */}
        <div className={`flex flex-col md:flex-row border-b-4 ${c.border}`}>
            <div className={`w-full md:w-1/3 ${c.profileBg} p-10 border-b-4 md:border-b-0 md:border-r-4 ${c.border} flex flex-col justify-center`}>
                <div className="flex items-center gap-4 mb-8">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border-4 shadow-sm ${currentTheme === 'boy' ? 'bg-blue-600 text-white border-blue-200' : 'bg-rose-100 text-stone-500 border-white'}`}><User className="w-8 h-8"/></div>
                    <div><h3 className="font-black text-2xl leading-none">学员档案</h3><p className="text-xs opacity-40 font-bold uppercase tracking-widest mt-1">Profile Card</p></div>
                </div>
                <div className={`${t.cardClass} bg-white p-8 space-y-6`}>
                    <div className="flex justify-between items-center border-b pb-3"><span className="font-bold opacity-40 leading-none">姓名</span><span className="font-black text-xl leading-none">{data.studentName}</span></div>
                    <div className="flex justify-between items-center border-b pb-3">
                      <span className="font-bold opacity-40 leading-none">年级</span>
                      <span className="flex items-center justify-center px-4 h-7 rounded-full bg-slate-100 font-bold text-sm leading-none">{data.grade}</span>
                    </div>
                    <div className="flex justify-between items-center"><span className="font-bold opacity-40 leading-none">老师</span><span className="font-bold leading-none">{data.teacher}</span></div>
                </div>
            </div>
            
            <div className={`w-full md:w-2/3 ${c.badgesBg} p-10`}>
                <div className="flex items-center gap-3 mb-8"><Trophy className="w-8 h-8 text-amber-400"/><h3 className="text-2xl font-black leading-none">{isHT ? '学习成长勋章' : '荣誉成就'}</h3></div>
                {isHT ? (
                    <div className="grid grid-cols-2 gap-6">
                        {data.htBadges?.map((badge: Badge) => (
                            <div key={badge.name} className={`${t.cardClass} bg-white/80 backdrop-blur-sm p-4 flex flex-col items-center justify-center shadow-sm`}>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 shadow-sm ${currentTheme === 'boy' ? 'bg-blue-600 text-white' : 'bg-rose-50 text-rose-300'}`}>
                                    {badge.level === 'progress' ? <Zap className="w-6 h-6"/> : badge.level === 'potential' ? <Rocket className="w-6 h-6"/> : <Star className="w-6 h-6"/>}
                                </div>
                                <h4 className="font-black text-sm mb-1 leading-none text-center">{badge.name}</h4>
                                <div className="flex gap-0.5 mb-2">
                                    {[...Array(5)].map((_, i) => (<Star key={i} className={`w-3.5 h-3.5 ${i < (badge.stars || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-100'}`} />))}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400/80 text-center leading-tight italic">“{badge.description}”</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex gap-10">
                        <div className="flex-1 flex flex-col items-center">
                            <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center shadow-lg transform rotate-3 mb-4 border-4 border-white ${
                                currentTheme === 'boy' ? 'bg-amber-400' : currentTheme === 'girl' ? 'bg-rose-300' : 'bg-amber-200'
                            }`}>
                                <Star className={`w-12 h-12 ${currentTheme === 'boy' ? 'text-white' : 'text-amber-700'}`}/>
                            </div>
                            <p className="font-black text-lg mb-2 leading-none text-center">{data.completionBadge.name}</p>
                            <div className={`${t.cardClass} bg-white/60 p-4 text-center text-xs font-bold leading-relaxed`}>{data.completionBadge.description}</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                            <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center shadow-lg transform -rotate-3 mb-4 border-4 border-white ${
                                currentTheme === 'boy' ? 'bg-indigo-600' : currentTheme === 'girl' ? 'bg-rose-400' : 'bg-amber-500'
                            }`}>
                                <Target className="w-12 h-12 text-white shadow-sm"/>
                            </div>
                            <p className="font-black text-lg mb-2 leading-none text-center">{data.accuracyBadge.name}</p>
                            <div className={`${t.cardClass} bg-white/60 p-4 text-center text-xs font-bold leading-relaxed`}>{data.accuracyBadge.description}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Learning Records & Chart */}
        <div className="flex flex-col lg:flex-row">
            {/* Table */}
            <div className={`w-full ${isHT ? 'lg:w-[45%]' : 'lg:w-[55%]'} border-b-4 lg:border-b-0 lg:border-r-4 ${c.border} bg-white p-8 flex flex-col`}>
                <div className="flex flex-col mb-8">
                    <h3 className="text-2xl font-black flex items-center gap-3 whitespace-nowrap leading-none"><BarChart2 className="w-8 h-8 text-indigo-500"/>{isHT ? `${data.studentName}同学 学习记录` : '学习闯关记录'}</h3>
                    <div className="mt-2 flex items-center justify-center px-6 h-8 bg-indigo-50 rounded-full text-indigo-600 font-black text-xs w-fit leading-none shadow-sm">
                        一节课20分钟，短时高效，每天练出效果！
                    </div>
                </div>
                
                {isHT && data.errorAnalysis && (
                  <div className="mb-6 p-5 bg-rose-50 rounded-[1.5rem] border-2 border-rose-100 shadow-sm animate-in slide-in-from-left duration-500 flex items-center">
                    <p className="text-xs font-bold text-rose-800/80 leading-relaxed italic">“{data.errorAnalysis.content}”</p>
                  </div>
                )}

                <div className={`${t.cardClass} border-2 overflow-hidden flex-grow`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className={c.tableHeader}>
                                <tr>
                                    <th className="px-4 py-4 text-left leading-none">单元内容</th>
                                    {!isHT && <th className="px-4 py-4 text-center leading-none">学习关联</th>}
                                    <th className="px-4 py-4 text-center leading-none">学习时长</th>
                                    {!isHT && <th className="px-4 py-4 text-center leading-none">学习分析</th>}
                                    {isHT && <th className="px-4 py-4 text-right leading-none">错误统计</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {tableUnits.map((u: any, i: number) => {
                                    const maxWrong = Math.max(...tableUnits.map((item:any) => item.wrongCount), 1);
                                    const wrongBarWidth = (u.wrongCount / maxWrong) * 80;
                                    return (
                                        <tr key={`${u.unitNumber}-${i}`} className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-100`}>
                                            <td className="px-4 py-5 font-black whitespace-nowrap text-xs leading-none">{u.unitName}</td>
                                            {!isHT && <td className="px-4 py-5 text-center align-middle">{renderAssociationBadge(u.association)}</td>}
                                            <td className="px-4 py-5 text-center font-bold opacity-50 text-xs leading-none">{formatDuration(u.timeSpentSeconds)}</td>
                                            {!isHT && <td className={`px-4 py-5 text-center font-black text-[11px] whitespace-nowrap leading-none ${u.status === 'low' ? 'text-slate-300' : 'text-indigo-500'}`}>{u.analysis}</td>}
                                            {isHT && (
                                                <td className="px-4 py-5 text-right min-w-[120px]">
                                                    <div className="flex items-center justify-end gap-3 h-full">
                                                        <div className="h-2 bg-rose-100 rounded-full overflow-hidden w-20 flex-shrink-0">
                                                            <div className="h-full bg-rose-400 rounded-full" style={{ width: `${wrongBarWidth}%` }}></div>
                                                        </div>
                                                        <span className="font-black text-rose-400 text-xs w-6 text-right leading-none">{u.wrongCount}</span>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {!isHT && monthlySummary && (
                  <div className="mt-8 space-y-6 animate-in fade-in duration-500">
                    <div className={`${t.cardClass} bg-indigo-600 text-white p-8 relative overflow-hidden shadow-xl`}>
                      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                      <h4 className="text-xl font-black flex items-center gap-3 mb-6 leading-none"><TrendingUp className="w-6 h-6"/> 📈 学习里程碑</h4>
                      <p className="text-sm font-bold leading-loose opacity-90">本月你累计学习 <span className="text-yellow-300 text-lg mx-1 leading-none">{monthlySummary.totalMinutes}</span> 分钟。完成【<span className="text-yellow-300 text-lg mx-1 leading-none">{monthlySummary.totalKPs}</span>个知识点】相当于攻克了 <span className="text-yellow-300 text-lg mx-1 leading-none">{monthlySummary.totalErrors}</span>个高频易错点。</p>
                    </div>
                  </div>
                )}
            </div>

            {/* Chart */}
            <div className={`w-full ${isHT ? 'lg:w-[55%]' : 'lg:w-[45%]'} ${c.chartBg} p-8 flex flex-col`}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                    <h3 className="text-2xl font-black flex items-center gap-3 whitespace-nowrap leading-none"><Lightbulb className="w-8 h-8 text-amber-500"/>{isHT ? `${data.studentName}同学 正确率趋势` : '趋势分析'}</h3>
                    <div className="flex items-center gap-2 print:hidden">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button onClick={() => onToggleMetric('accuracy')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${trendMetric === 'accuracy' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'} leading-none`}>正确率</button>
                            <button onClick={() => onToggleMetric('passRate')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${trendMetric === 'passRate' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'} leading-none`}>过关率</button>
                        </div>
                        {isHT && <button onClick={onToggleZoom} className={`p-2 rounded-xl border-2 transition-all ${isChartZoomed ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white text-slate-400'}`}>{isChartZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>}
                    </div>
                </div>
                <div className={`${t.cardClass} bg-white p-6 h-[400px] mb-8 relative shadow-md border-indigo-50 border-4`}>
                    <ReportChart data={tableUnits} color={isHT ? '#818cf8' : '#f97316'} isZoomed={isHT && isChartZoomed} metric={trendMetric}/>
                </div>
                <div className={`${t.cardClass} bg-white p-6 shadow-sm border-2 ${c.border} flex flex-col justify-center min-h-[100px]`}>
                    <h4 className={`text-lg font-black mb-4 flex items-center gap-2 ${c.headerText} leading-none`}><Zap className="w-5 h-5 text-yellow-400 fill-current"/>{data.trendAnalysis.title}</h4>
                    <p className="font-bold text-sm leading-relaxed opacity-80 italic">“{data.trendAnalysis.content}”</p>
                </div>
            </div>
        </div>

        {/* Ranking Section */}
        <div className="bg-white p-10">
            <div className={`${t.cardClass} border-2 ${c.border} overflow-hidden shadow-sm`}>
                <div className={`${c.rankingHeaderBg} p-6 border-b flex justify-between items-center`}><h3 className="text-2xl font-black flex items-center gap-3 leading-none"><ListOrdered className="w-8 h-8 text-stone-400"/>{isHT ? '正确率排名' : '通关率排名'}</h3><span className="font-bold text-xs opacity-40 leading-none">共有 {total} 名学员参与统计</span></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left w-20 leading-none text-center">名次</th>
                                <th className="px-6 py-4 text-left leading-none">姓名</th>
                                <th className="px-6 py-4 text-left leading-none">学号 (UID)</th>
                                {isHT && rankingLessonCols.map(col => (<th key={col} className={`px-2 py-4 text-center whitespace-nowrap leading-none ${col === 0 ? 'bg-amber-50 text-amber-600 border-r-2 border-amber-100' : ''}`}>{col === 0 ? '课前测' : `L${col}`}</th>))}
                                <th className="px-6 py-4 text-right leading-none">{isHT ? '综合得分' : '通关率'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {displayedRanks.map(r => {
                                const isMe = r.userId === String(data.studentId); const masked = isMe ? r.name : (r.name.charAt(0) + 'x'.repeat(Math.min(r.name.length - 1, 1))).slice(0, 4);
                                return (
                                    <tr key={r.userId} className={`${isMe ? c.rankingHighlightRow : 'hover:bg-slate-50/50'} transition-all`}>
                                        <td className="px-6 py-5">
                                          <div className="flex items-center justify-center w-full">
                                            <span className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black ${r.rank <= 3 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'} ${isMe ? 'ring-4 ring-amber-400/20' : ''} leading-none text-center`}>{r.rank}</span>
                                          </div>
                                        </td>
                                        <td className={`px-6 py-5 font-black text-base ${isMe ? 'text-amber-600' : 'opacity-70'} flex items-center h-full`}>
                                          <span className="leading-none">{masked}</span>
                                          {isMe && <span className="ml-2 flex items-center justify-center text-[10px] bg-amber-400 text-white px-2 h-4 rounded-full font-sans uppercase leading-none font-black">ME</span>}
                                        </td>
                                        <td className={`px-6 py-5 font-black text-sm font-mono opacity-50 leading-none`}>{r.userId}</td>
                                        {isHT && rankingLessonCols.map(col => (<td key={col} className={`px-2 py-5 text-center font-bold text-[10px] ${col === 0 ? 'bg-amber-50/30 border-r-2 border-amber-100/50' : ''} ${r.accuracies[col] !== undefined ? 'text-slate-600' : 'text-slate-200'} leading-none`}>{r.accuracies[col] !== undefined ? `${r.accuracies[col].toFixed(0)}%` : '-'}</td>))}
                                        <td className="px-6 py-5 text-right font-black text-lg whitespace-nowrap leading-none">{isHT ? r.totalScore : `${r.completionRate.toFixed(1)}%`}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className={`${c.rankingBannerBg} ${c.rankingBannerText} p-8 text-center font-black text-sm italic leading-relaxed`}>{getRankComment()}</div>
            </div>
        </div>

        {/* Footer */}
        <div className={`${c.teacherSection} p-12 text-center relative overflow-hidden flex flex-col items-center justify-center`}>
            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
                <MessageCircleHeart className="w-12 h-12 mx-auto mb-6 opacity-40"/>
                <p className="text-2xl font-black italic mb-4 opacity-90 leading-snug text-center">“ 学习不仅是分数的累积，更是思维的破壳而出。亲爱的家长，宝贝正在用每一个百分点的进步，书写属于自己的未来！让我们共同呵护这份成长。 ”</p>
                <p className="font-bold opacity-60 leading-none">— 您的辅导老师 {data.teacher}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
