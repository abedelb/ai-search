import React from 'react';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

export interface ChartData {
  type: 'line' | 'bar' | 'pie';
  title: string;
  data: any;
  xLabel?: string;
  yLabel?: string;
}

interface ChartRendererProps {
  chart: ChartData;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ chart }) => {
  if (chart.type === 'line') {
    return <LineChart chart={chart} />;
  } else if (chart.type === 'bar') {
    return <BarChart chart={chart} />;
  } else if (chart.type === 'pie') {
    return <PieChart chart={chart} />;
  }
  return null;
};

const LineChart: React.FC<{ chart: ChartData }> = ({ chart }) => {
  const { title, data, xLabel = 'X Axis', yLabel = 'Y Axis' } = chart;
  const width = 600;
  const height = 300;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const series = data.series || [];
  const labels = data.labels || [];

  if (series.length === 0 || labels.length === 0) return null;

  const allValues = series.flatMap((s: any) => s.values);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue;

  const xStep = chartWidth / (labels.length - 1 || 1);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <svg width={width} height={height} className="mx-auto">
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#d1d5db"
          strokeWidth="2"
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#d1d5db"
          strokeWidth="2"
        />

        {labels.map((label: string, i: number) => (
          <text
            key={i}
            x={padding.left + i * xStep}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
          >
            {label}
          </text>
        ))}

        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          fontSize="13"
          fill="#4b5563"
          fontWeight="500"
        >
          {xLabel}
        </text>

        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          fontSize="13"
          fill="#4b5563"
          fontWeight="500"
          transform={`rotate(-90, 15, ${height / 2})`}
        >
          {yLabel}
        </text>

        {series.map((s: any, seriesIndex: number) => {
          const points = s.values
            .map((value: number, i: number) => {
              const x = padding.left + i * xStep;
              const y =
                height -
                padding.bottom -
                ((value - minValue) / valueRange) * chartHeight;
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <g key={seriesIndex}>
              <polyline
                points={points}
                fill="none"
                stroke={colors[seriesIndex % colors.length]}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {s.values.map((value: number, i: number) => {
                const x = padding.left + i * xStep;
                const y =
                  height -
                  padding.bottom -
                  ((value - minValue) / valueRange) * chartHeight;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={colors[seriesIndex % colors.length]}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="flex justify-center gap-6 mt-4">
        {series.map((s: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-sm text-gray-700">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BarChart: React.FC<{ chart: ChartData }> = ({ chart }) => {
  const { title, data, xLabel = 'Category', yLabel = 'Value' } = chart;
  const width = 600;
  const height = 300;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const categories = data.categories || [];
  const values = data.values || [];

  if (categories.length === 0 || values.length === 0) return null;

  const maxValue = Math.max(...values);
  const barWidth = chartWidth / categories.length * 0.7;
  const barGap = chartWidth / categories.length * 0.3;

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <svg width={width} height={height} className="mx-auto">
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#d1d5db"
          strokeWidth="2"
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#d1d5db"
          strokeWidth="2"
        />

        {categories.map((category: string, i: number) => {
          const x = padding.left + i * (barWidth + barGap) + barGap / 2;
          const barHeight = (values[i] / maxValue) * chartHeight;
          const y = height - padding.bottom - barHeight;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={colors[i % colors.length]}
                rx="4"
              />
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
              >
                {category}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fontSize="12"
                fill="#374151"
                fontWeight="600"
              >
                {values[i]}
              </text>
            </g>
          );
        })}

        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          fontSize="13"
          fill="#4b5563"
          fontWeight="500"
        >
          {xLabel}
        </text>

        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          fontSize="13"
          fill="#4b5563"
          fontWeight="500"
          transform={`rotate(-90, 15, ${height / 2})`}
        >
          {yLabel}
        </text>
      </svg>
    </div>
  );
};

const PieChart: React.FC<{ chart: ChartData }> = ({ chart }) => {
  const { title, data } = chart;
  const centerX = 200;
  const centerY = 150;
  const radius = 100;

  const segments = data.segments || [];
  if (segments.length === 0) return null;

  const total = segments.reduce((sum: number, seg: any) => sum + seg.value, 0);

  let currentAngle = -90;
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="flex items-center justify-center gap-8">
        <svg width={400} height={300} className="flex-shrink-0">
          {segments.map((segment: any, i: number) => {
            const angle = (segment.value / total) * 360;
            const startAngle = (currentAngle * Math.PI) / 180;
            const endAngle = ((currentAngle + angle) * Math.PI) / 180;

            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);

            const largeArc = angle > 180 ? 1 : 0;

            const path = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
              'Z',
            ].join(' ');

            const labelAngle = currentAngle + angle / 2;
            const labelRadius = radius * 0.65;
            const labelX = centerX + labelRadius * Math.cos((labelAngle * Math.PI) / 180);
            const labelY = centerY + labelRadius * Math.sin((labelAngle * Math.PI) / 180);

            currentAngle += angle;

            return (
              <g key={i}>
                <path
                  d={path}
                  fill={colors[i % colors.length]}
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fontSize="13"
                  fill="white"
                  fontWeight="700"
                >
                  {Math.round((segment.value / total) * 100)}%
                </text>
              </g>
            );
          })}
        </svg>
        <div className="flex flex-col gap-2">
          {segments.map((segment: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <div>
                <div className="text-sm font-medium text-gray-900">{segment.label}</div>
                <div className="text-xs text-gray-500">{segment.value} ({Math.round((segment.value / total) * 100)}%)</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
