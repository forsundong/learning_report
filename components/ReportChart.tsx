import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  data: any[]; 
  color?: string; 
  isZoomed?: boolean;
  metric?: 'accuracy' | 'passRate';
}

const ReportChart: React.FC<Props> = ({ 
  data, 
  color = '#f97316', 
  isZoomed = false,
  metric = 'accuracy'
}) => {
  const metricKey = metric;
  const classMetricKey = metric === 'accuracy' ? 'classAccuracy' : 'classPassRate';
  const label = metric === 'accuracy' ? '作答正确率' : '过关率';

  const chartData = data.map(d => ({
    name: d.unitNumber,
    displayOrder: String(d.unitNumber), 
    fullName: d.unitName,
    value: d[metricKey],
    classAverage: d[classMetricKey] 
  }));

  const getYDomain = (): [number, number] => {
    if (!isZoomed || chartData.length === 0) return [0, 100];
    const allValues = chartData.flatMap(d => [d.value, d.classAverage]).filter(v => typeof v === 'number');
    if (allValues.length === 0) return [0, 100];
    const minVal = Math.min(...allValues);
    const start = Math.max(0, Math.floor(minVal - 5));
    return [start, 100];
  };

  return (
    <div className="w-full h-full flex flex-col font-sans">
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
            <XAxis 
              dataKey="displayOrder" 
              tick={{fontSize: 12, fill: '#78716c', fontWeight: 800}}
              axisLine={false}
              tickLine={false}
              padding={{ left: 20, right: 20 }}
            />
            <YAxis 
              domain={getYDomain()} 
              tick={{fontSize: 12, fill: '#78716c', fontWeight: 700}}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}%`, 
                name === 'value' ? `我的${label}` : `班级平均${label}`
              ]}
              contentStyle={{ 
                  borderRadius: '16px', 
                  border: `2px solid ${color}`,
                  backgroundColor: '#fff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontFamily: 'Nunito, sans-serif',
                  color: '#44403c',
                  fontWeight: 'bold'
              }}
              labelFormatter={(label) => `第 ${label} 单元`}
              cursor={{ stroke: color, strokeWidth: 2, strokeDasharray: '4 4' }}
            />
            <Line 
              type="monotone" 
              dataKey="classAverage" 
              name="classAverage" 
              stroke="#cbd5e1"
              strokeWidth={4}
              strokeDasharray="8 8" 
              dot={{ r: 0 }} 
              activeDot={false}
            />
            <Line
              connectNulls
              type="monotone"
              dataKey="value"
              name="value"
              stroke={color} 
              strokeWidth={5}
              dot={{ r: 6, fill: '#fff', stroke: color, strokeWidth: 4 }}
              activeDot={{ r: 9, fill: color, stroke: '#fff', strokeWidth: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ReportChart;