import React, { useState, useMemo } from 'react';
import { StudentDataRow } from '../types';
import { getStudentSummaries } from '../utils';
import { Search, Filter, ChevronRight, Users, GraduationCap } from 'lucide-react';

interface Props {
  data: StudentDataRow[];
  onSelectStudent: (name: string) => void;
  onReupload: () => void;
}

const StudentList: React.FC<Props> = ({ data, onSelectStudent, onReupload }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');

  const students = useMemo(() => getStudentSummaries(data), [data]);

  const grades = useMemo(() => {
    const g = new Set(students.map(s => s.grade));
    return Array.from(g).filter(Boolean);
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.teacher.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;

      return matchesSearch && matchesGrade;
    });
  }, [students, searchTerm, gradeFilter]);

  return (
    <div className="max-w-5xl mx-auto my-8 space-y-6 font-sans">
      <div className="bg-white rounded-3xl shadow-lg border-2 border-indigo-100 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-indigo-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
              学生数据列表
            </h2>
            <p className="text-indigo-400 font-medium mt-2 ml-1">
              共导入 {students.length} 名学生，{data.length} 条学习记录
            </p>
          </div>
          <button 
            onClick={onReupload}
            className="text-sm font-bold text-gray-400 hover:text-red-500 underline transition-colors"
          >
            重新上传文件
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 bg-indigo-50/50 p-2 rounded-2xl border border-indigo-100">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
            <input
              type="text"
              placeholder="搜索姓名或辅导老师..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-transparent focus:border-indigo-300 rounded-xl text-indigo-800 placeholder-indigo-300 focus:outline-none focus:ring-0 font-medium transition-all"
            />
          </div>
          
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-white border-2 border-transparent focus:border-indigo-300 rounded-xl text-indigo-800 font-medium appearance-none focus:outline-none focus:ring-0 cursor-pointer transition-all"
            >
              <option value="all">所有年级</option>
              {grades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-3xl shadow-lg border-2 border-indigo-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-indigo-50/50 border-b border-indigo-100 text-indigo-400 uppercase font-bold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-5">学生姓名</th>
                <th className="px-6 py-5">年级</th>
                <th className="px-6 py-5">辅导老师</th>
                <th className="px-6 py-5 text-center">记录数</th>
                <th className="px-6 py-5 text-center">最新进度</th>
                <th className="px-6 py-5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.name} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-5">
                        <div className="font-bold text-lg text-indigo-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {student.grade}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-medium text-gray-600">{student.teacher}</td>
                    <td className="px-6 py-5 text-center font-bold text-indigo-300">{student.unitCount}</td>
                    <td className="px-6 py-5 text-center font-medium text-gray-500">第 {student.lastUnit} 单元</td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => onSelectStudent(student.name)}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        生成报告
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                        <div className="text-4xl">🤔</div>
                        <div className="font-medium">没有找到符合条件的学生数据</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-indigo-50/30 px-6 py-4 border-t border-indigo-100 text-xs font-bold text-indigo-300 flex justify-between">
            <span>显示 {filteredStudents.length} / {students.length} 位学生</span>
        </div>
      </div>
    </div>
  );
};

export default StudentList;