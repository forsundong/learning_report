import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, AlertCircle, FileText, UserCircle, Users } from 'lucide-react';
import { StudentDataRow, UserRole } from '../types';
import { validateExcelData } from '../utils';

interface Props {
  onDataLoaded: (data: StudentDataRow[]) => void;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const FileUpload: React.FC<Props> = ({ onDataLoaded, role, onRoleChange }) => {
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const processFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<StudentDataRow>(ws);
        const validation = validateExcelData(data);
        if (!validation.valid) return setError(validation.error || '无效文件');
        onDataLoaded(data);
      } catch (err) { setError('解析文件出错'); }
    };
    reader.readAsBinaryString(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 space-y-6">
      <div className="flex justify-center gap-4 mb-2">
          <button 
            onClick={() => onRoleChange('counselor')}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all ${role === 'counselor' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white text-indigo-300 border-2 border-indigo-50 hover:bg-indigo-50'}`}
          >
            <UserCircle className="w-5 h-5" /> 课导模式
          </button>
          <button 
            onClick={() => onRoleChange('headteacher')}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all ${role === 'headteacher' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white text-indigo-300 border-2 border-indigo-50 hover:bg-indigo-50'}`}
          >
            <Users className="w-5 h-5" /> 班主任模式
          </button>
      </div>

      <div 
        className={`p-10 bg-white rounded-[2.5rem] shadow-xl border-4 border-dashed transition-all
          ${dragActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-100'}
          ${error ? 'border-red-200 bg-red-50' : ''}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <div className={`p-6 rounded-full shadow-sm ${error ? 'bg-red-100' : 'bg-indigo-100'}`}>
            <Upload className={`w-12 h-12 ${error ? 'text-red-500' : 'text-indigo-500'}`} />
          </div>
          <h2 className="text-3xl font-black text-slate-800">上传学习数据 Excel</h2>
          <p className="text-slate-400 font-bold max-w-sm">请上传班级学习记录表格，系统将自动根据所选身份生成精美报告</p>
          
          <label className="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white font-black px-12 py-4 rounded-3xl transition-all shadow-xl hover:-translate-y-1 flex items-center gap-2">
            <FileText className="w-6 h-6" /> 选择文件
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;