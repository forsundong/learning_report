
import { StudentDataRow, ProcessedReportData, UnitData, Badge, TrendAnalysis, MonthlySummary, UserRole } from './types';

export const CURRICULA: Record<string, string[]> = {
  '一年级': ['应用题——比较多少初步', '应用题——比较多少进阶', '逻辑推理——顺序', '逻辑推理——不等', '逻辑推理——相等'],
  '一年级弹窗': ['空间想象——正方体计数', '空间想象——数数看不见', '逻辑推理——顺序', '逻辑推理——不等', '逻辑推理——相等'],
  '二年级': ['应用题——复杂的排队问题初步', '应用题——复杂的排队问题进阶', '应用题——还原倒推', '数感——横式数字谜初步', '数感——横式数字谜进阶'],
  '三年级': ['应用题——年龄问题初步', '应用题——年龄问题进阶', '转化思想—巧求最短路线', '计算——巧填算符', '计算——巧解整数计算'],
  '四年级': ['盈亏问题', '生活中的计数原理', '图形中的计数原理', '长方形中的倍数关系', '数形结合'],
  '五年级': ['基础行程问题', '环形路线问题', '火车行程问题', '小数乘除法巧算', '小数提取公因数'],
  '六年级': ['间隔发车问题', '特殊法比较分数大小', '操作与规律', '不定方程', '短除模型']
};

export const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0分钟';
  const hours = Math.floor(seconds / 3600);
  const remainingSeconds = seconds % 3600;
  const mins = Math.ceil(remainingSeconds / 60);
  if (hours > 0) return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`;
  return `${mins}分钟`;
};

export const parseRate = (rate: string | number | undefined): number => {
  if (rate === undefined || rate === null) return 0;
  if (typeof rate === 'number') return rate * 100;
  if (typeof rate === 'string') {
    if (rate.includes('%')) return parseFloat(rate.replace('%', ''));
    const val = parseFloat(rate);
    return val <= 1 ? val * 100 : val;
  }
  return 0;
};

export const parseSeconds = (val: string | number): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).trim();
  if (str.includes('分') || str.includes('秒')) {
    let totalSeconds = 0;
    const minutesMatch = str.match(/(\d+)\s*分/);
    const secondsMatch = str.match(/(\d+)\s*秒/);
    if (minutesMatch) totalSeconds += parseInt(minutesMatch[1], 10) * 60;
    if (secondsMatch) totalSeconds += parseInt(secondsMatch[1], 10);
    return totalSeconds;
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const translateGrade = (grade: string): string => {
  if (!grade) return '未知年级';
  const map: Record<string, string> = {
    'pk': '幼儿园小班', 'k': '幼儿园大班', 'one': '一年级', 'two': '二年级',
    'three': '三年级', 'four': '四年级', 'five': '五年级', 'six': '六年级'
  };
  const lowerGrade = grade.toLowerCase().trim();
  if (map[lowerGrade]) return map[lowerGrade];
  const foundKey = Object.keys(map).find(k => lowerGrade.includes(k));
  return foundKey ? map[foundKey] : grade;
};

export const getAvailableUnits = (rows: StudentDataRow[], studentName: string): number[] => {
    const units = new Set<number>();
    rows.forEach(r => {
        if (r.real_name === studentName) {
            const seq = parseInt(String(r.level_sequence), 10);
            if (!isNaN(seq)) units.add(seq);
        }
    });
    return Array.from(units).sort((a, b) => a - b);
};

export const validateExcelData = (data: any[]): { valid: boolean; error?: string } => {
  if (!data || data.length === 0) return { valid: false, error: '文件为空' };
  const firstRow = data[0];
  const req = ['real_name', 'level_sequence', 'unit_sequence', 'unit_finish_status', 'answer_right_rate', 'first_cost_seconds'];
  const missing = req.filter(field => !(field in firstRow));
  if (missing.length > 0) return { valid: false, error: `缺少必要字段: ${missing.join(', ')}` };
  return { valid: true };
};

const getCompletionBadge = (highCount: number): Badge => {
  if (highCount >= 4) return { name: '金牌完课王', type: 'completion', level: 'gold', description: '金牌成就达成！全课程通关，你就是学习王者！' };
  return { name: '学习之星', type: 'completion', level: 'star', description: '学习之星已点亮！表现非常亮眼，加油向前冲！' };
};

const getAccuracyBadge = (avgAcc: number): Badge => {
  if (avgAcc >= 90) return { name: '学习典范', type: 'accuracy', level: 'model', description: '你的学习质量极高，展现典范级的掌握力。' };
  return { name: '稳定高手', type: 'accuracy', level: 'master', description: '稳定且扎实，保持这个节奏！' };
};

export const processExcelData = (
    rows: StudentDataRow[], 
    targetStudentName: string,
    role: UserRole,
    unitRange?: { min: number, max: number }
): ProcessedReportData | null => {
  if (!rows || rows.length === 0) return null;
  const studentRows = rows.filter(r => r.real_name === targetStudentName);
  if (studentRows.length === 0) return null;

  const lessons: UnitData[] = [];
  const targetLevel = unitRange ? unitRange.max : Math.max(...studentRows.map(r => parseInt(String(r.level_sequence), 10)));
  const unitRows = studentRows.filter(r => parseInt(String(r.level_sequence), 10) === targetLevel);

  if (role === 'headteacher') {
    unitRows.forEach(r => {
      const seq = parseInt(String(r.unit_sequence), 10);
      const acc = parseRate(r.answer_right_rate);
      const passRate = parseRate(r.pass_rate);
      
      const allStudentsInThisLesson = rows.filter(row => 
        parseInt(String(row.level_sequence), 10) === targetLevel && 
        parseInt(String(row.unit_sequence), 10) === seq
      );
      
      const validStudentsAcc = allStudentsInThisLesson.filter(row => parseRate(row.answer_right_rate) > 0);
      const classAvgAcc = validStudentsAcc.length > 0 
        ? validStudentsAcc.reduce((sum, row) => sum + parseRate(row.answer_right_rate), 0) / validStudentsAcc.length 
        : 0;

      const validStudentsPass = allStudentsInThisLesson.filter(row => parseRate(row.pass_rate) > 0);
      const classAvgPass = validStudentsPass.length > 0 
        ? validStudentsPass.reduce((sum, row) => sum + parseRate(row.pass_rate), 0) / validStudentsPass.length 
        : 0;

      const validStudentsTime = allStudentsInThisLesson.filter(row => parseSeconds(row.first_cost_seconds) > 0);
      const classAvgTime = validStudentsTime.length > 0
        ? validStudentsTime.reduce((sum, row) => sum + parseSeconds(row.first_cost_seconds), 0) / validStudentsTime.length
        : 0;

      lessons.push({
        unitNumber: seq,
        unitName: seq === 0 ? '课前测' : `第${seq}讲`,
        timeSpentSeconds: parseSeconds(r.first_cost_seconds),
        classTimeSpentSeconds: classAvgTime,
        status: r.unit_finish_status === '完课' ? 'high' : 'low',
        statusLabel: r.unit_finish_status === '完课' ? '已完成' : '学习中',
        accuracy: acc,
        classAccuracy: classAvgAcc,
        passRate: passRate,
        classPassRate: classAvgPass,
        wrongCount: parseInt(String(r.first_finish_answer_step_fail_cnt ?? r.wrong_answer_count ?? 0)),
        analysis: ''
      });
    });
    lessons.sort((a, b) => a.unitNumber - b.unitNumber);

    // 1. 勋章判定星级计算 (精准逻辑)
    const preTest = lessons.find(l => l.unitNumber === 0);
    let progressStars = 0, persistenceStars = 0, timeStars = 0, sprintStars = 0;
    
    lessons.forEach(l => {
        if (l.unitNumber === 0) return;
        // 学习进步徽章: 共有X节课比课前测进步
        if (preTest && l.accuracy > preTest.accuracy) progressStars++;
        // 坚持小达人: 共有X节课完成作答
        if (l.status === 'high') persistenceStars++;
        // 时间小飞侠: 共有X节课比对应课程平均用时更短
        if (l.timeSpentSeconds > 0 && l.timeSpentSeconds < l.classTimeSpentSeconds) timeStars++;
        // 满分冲刺星: 共有X节课正确率≥50%
        if (l.accuracy >= 50) sprintStars++;
    });

    const htBadges: Badge[] = [
      { name: '学习进步徽章', type: 'accuracy', level: 'progress', description: '每一次突破，都是对自我的超越，你是最棒的进步小达人！', stars: Math.min(5, progressStars) },
      { name: '坚持小达人', type: 'completion', level: 'growth', description: '滴水穿石，你的每一份坚持都在为成功的未来铺路，继续保持！', stars: Math.min(5, persistenceStars) },
      { name: '时间小飞侠', type: 'accuracy', level: 'potential', description: '灵动如闪电，你的高效思维让学习变得如此轻松，为你点赞！', stars: Math.min(5, timeStars) },
      { name: '满分冲刺星', type: 'accuracy', level: 'master', description: '瞄准目标，全力以赴，你的专注让每一个关卡都变得简单！', stars: Math.min(5, sprintStars) }
    ];

    const totalTime = lessons.reduce((s, l) => s + l.timeSpentSeconds, 0);
    return {
      studentName: targetStudentName, grade: translateGrade(studentRows[0]?.package_grade),
      teacher: studentRows[0]?.counselor_name || '老师', role,
      totalTimeSeconds: totalTime, avgTimePerSession: totalTime / (lessons.length || 1),
      timeComment: '一节课20分钟，短时高效，每天练出效果！',
      completionBadge: getCompletionBadge(0), 
      accuracyBadge: getAccuracyBadge(0), 
      htBadges,
      completedUnitsCount: lessons.filter(l => l.status === 'high').length,
      units: lessons, 
      trendAnalysis: calculateHTAccuracyTrend(lessons),
      errorAnalysis: calculateHTErrorTrend(lessons),
      monthlySummary: { milestone: '', highlights: [], improvements: [] }
    };
  } else {
    // 课导模式原有逻辑
    const unitMap = new Map<number, UnitData>();
    studentRows.forEach(r => {
        const uSeq = parseInt(String(r.level_sequence), 10);
        if (unitRange && (uSeq < unitRange.min || uSeq > unitRange.max)) return;
        if (!unitMap.has(uSeq)) {
            unitMap.set(uSeq, {
                unitNumber: uSeq, unitName: `第${uSeq}单元`, timeSpentSeconds: 0, classTimeSpentSeconds: 0, status: 'low',
                statusLabel: '学习中', accuracy: 0, classAccuracy: 0, passRate: 0, classPassRate: 0, wrongCount: 0, analysis: ''
            });
        }
        const u = unitMap.get(uSeq)!;
        u.timeSpentSeconds += parseSeconds(r.first_cost_seconds);
        u.accuracy = (u.accuracy + parseRate(r.answer_right_rate)) / 2;
        u.passRate = (u.passRate + parseRate(r.pass_rate)) / 2;
        if (r.unit_finish_status === '完课') u.status = 'high';
    });

    const lessonsList = Array.from(unitMap.values()).sort((a, b) => a.unitNumber - b.unitNumber);
    lessonsList.forEach(l => {
      const allStudentsInThisUnit = rows.filter(row => 
        parseInt(String(row.level_sequence), 10) === l.unitNumber
      );
      const validStudentsAcc = allStudentsInThisUnit.filter(row => parseRate(row.answer_right_rate) > 0);
      l.classAccuracy = validStudentsAcc.length > 0 ? validStudentsAcc.reduce((sum, row) => sum + parseRate(row.answer_right_rate), 0) / validStudentsAcc.length : 0;
      const validStudentsPass = allStudentsInThisUnit.filter(row => parseRate(row.pass_rate) > 0);
      l.classPassRate = validStudentsPass.length > 0 ? validStudentsPass.reduce((sum, row) => sum + parseRate(row.pass_rate), 0) / validStudentsPass.length : 0;
      if (l.status === 'high') {
        l.analysis = l.accuracy >= l.classAccuracy ? '掌握扎实，超越平均' : '态度认真，请巩固错题';
      }
    });

    const totalTime = lessonsList.reduce((s, l) => s + l.timeSpentSeconds, 0);
    const avgAcc = lessonsList.reduce((s, l) => s + l.accuracy, 0) / (lessonsList.length || 1);

    return {
      studentName: targetStudentName, grade: translateGrade(studentRows[0]?.package_grade),
      teacher: studentRows[0]?.counselor_name || '老师', role,
      totalTimeSeconds: totalTime, avgTimePerSession: totalTime / (lessonsList.length || 1),
      timeComment: '学习效率很高，表现出色。',
      completionBadge: getCompletionBadge(lessonsList.filter(l => l.status === 'high').length),
      accuracyBadge: getAccuracyBadge(avgAcc),
      completedUnitsCount: lessonsList.filter(l => l.status === 'high').length,
      units: lessonsList, 
      trendAnalysis: calculateCounselorTrend(lessonsList),
      monthlySummary: { milestone: '', highlights: [], improvements: [] }
    };
  }
};

/**
 * 班主任系统：正确率趋势评语 (新规则1,2,3)
 */
function calculateHTAccuracyTrend(lessons: UnitData[]): TrendAnalysis {
    const preTest = lessons.find(l => l.unitNumber === 0);
    const activeLessons = lessons.filter(l => l.unitNumber > 0).sort((a, b) => a.unitNumber - b.unitNumber);
    if (activeLessons.length === 0) return { status: 'stable', title: '开启挑战', content: '宝贝已准备就绪，期待开启精彩的思维闯关之旅！' };

    const latest = activeLessons[activeLessons.length - 1];
    
    // 规则3：正确率节节攀升 (必须有2节以上且单调递增)
    let isRising = activeLessons.length >= 2;
    for (let i = 1; i < activeLessons.length; i++) {
        if (activeLessons[i].accuracy <= activeLessons[i-1].accuracy) {
            isRising = false;
            break;
        }
    }
    if (isRising) {
        return { 
          status: 'rising', 
          title: '完美的阶梯式成长', 
          content: `完美的阶梯式成长！课程设计的每一步挑战，孩子都步步为营，正确率从${activeLessons[0].accuracy.toFixed(0)}%一路稳定升至${latest.accuracy.toFixed(0)}%。这正是科学学习路径与孩子努力同频共振的证明。` 
        };
    }

    // 规则1 & 2 (对比课前测)
    if (preTest) {
        const x = preTest.accuracy.toFixed(0);
        const y = latest.accuracy.toFixed(0);
        const z = Math.abs(latest.accuracy - preTest.accuracy).toFixed(0);
        const n = latest.unitNumber;

        if (latest.accuracy > preTest.accuracy) {
            return { 
              status: 'improving', 
              title: '进步跨越，表现亮眼', 
              content: `太棒了！对比课前测（正确率${x}%），宝贝在第${n}课的正确率已提升至 ${y}%，${z}个百分点的跨越清晰展现了进步！` 
            };
        } else {
            return { 
              status: 'potential', 
              title: '坚持思考，潜力无限', 
              content: `值得点赞！从课前到第${n}节课的全程学习，宝贝展现了出色的坚持与思考习惯。面对不断升级的挑战仍兴趣盎然，这份专注力是未来突破的最大潜力。` 
            };
        }
    }

    return { 
      status: 'stable', 
      title: '保持状态', 
      content: '展现了出色的学习习惯，面对挑战毫不退缩。保持这份专注力，下一次突破就在眼前！' 
    };
}

/**
 * 班主任系统：作答错误统计评语 (新规则1,2,3)
 */
function calculateHTErrorTrend(lessons: UnitData[]): TrendAnalysis {
    const preTest = lessons.find(l => l.unitNumber === 0);
    const activeLessons = lessons.filter(l => l.unitNumber > 0).sort((a, b) => a.unitNumber - b.unitNumber);
    if (activeLessons.length === 0) return { status: 'stable', title: '学习足迹', content: '暂无记录，期待宝贝精彩表现。' };

    const latest = activeLessons[activeLessons.length - 1];

    // 规则3：错误次数逐课降低
    let isDecreasing = activeLessons.length >= 2;
    for (let i = 1; i < activeLessons.length; i++) {
        if (activeLessons[i].wrongCount >= activeLessons[i-1].wrongCount) {
            isDecreasing = false;
            break;
        }
    }
    if (isDecreasing) {
        return { 
          status: 'success', 
          title: '步步为营，飞速进步', 
          content: '步步为营，错题持续减少，学习习惯与效果俱佳，进步飞速！' 
        };
    }

    // 规则1 & 2 (对比课前测错误数)
    if (preTest) {
        if (latest.wrongCount < preTest.wrongCount) {
            return { 
              status: 'improving', 
              title: '成效显著', 
              content: '错题日益减少，可见知识掌握越发扎实牢固！' 
            };
        } else if (latest.wrongCount > preTest.wrongCount) {
            return { 
              status: 'extension', 
              title: '思维拓展', 
              content: '挑战升级，敢于尝试复杂题目，正是思维深入拓展的表现！' 
            };
        }
    }

    return { 
      status: 'stable', 
      title: '专注攻克', 
      content: '每一道错题的订正都是一次思维的重塑，保持这种认真的学习态度。' 
    };
}

function calculateCounselorTrend(lessons: UnitData[]): TrendAnalysis {
    if (lessons.length === 0) return { status: 'stable', title: '稳步提升', content: '继续保持良好的学习状态！' };
    const first = lessons[0];
    const last = lessons[lessons.length - 1];
    const alwaysAbove = lessons.every(l => l.accuracy >= l.classAccuracy);
    const isRising = last.accuracy > first.accuracy;

    if (alwaysAbove && isRising) return { status: 'rising', title: '持续领先且上升', content: '表现优秀且持续进步！各单元正确率均高于班级平均水平并稳步上升。' };
    if (alwaysAbove) return { status: 'above', title: '整体领先', content: '整体表现稳定领先！基础扎实，保持这个节奏。' };
    return { status: 'stable', title: '紧跟步伐', content: '表现稳定，跟紧班级步伐，突破薄弱环节有望实现领先。' };
}

export const getStudentSummaries = (rows: StudentDataRow[]) => {
  const map = new Map<string, any>();
  rows.forEach(r => {
    if (!map.has(r.real_name)) {
      map.set(r.real_name, { name: r.real_name, grade: translateGrade(r.package_grade), teacher: r.counselor_name, unitCount: 0, lastUnit: 0 });
    }
    const s = map.get(r.real_name)!;
    s.unitCount++;
    s.lastUnit = Math.max(s.lastUnit, parseInt(String(r.level_sequence), 10));
  });
  return Array.from(map.values());
};
