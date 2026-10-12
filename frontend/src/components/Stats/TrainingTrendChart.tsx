import { useState } from 'react';
import { Card } from '../ui/Card';

export interface MonthlyTrendPoint {
  month: string;
  totalVolume: number;
  workoutCount: number;
  muscleGroupVolumes: Record<string, number>;
}

export type ChartMetric =
  | 'totalVolume'
  | 'workoutCount'
  | 'muscleGroupVolume';

interface Props {
  data: MonthlyTrendPoint[];
  metric: ChartMetric;
  onMetricChange: (metric: ChartMetric) => void;
}

const metricLabels: Record<ChartMetric, string> = {
  totalVolume: 'Total Volume',
  workoutCount: 'Workout Count',
  muscleGroupVolume: 'Volume by Muscle Group',
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonth(month: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: '2-digit',
  }).format(new Date(`${month}-01T12:00:00`));
}

export default function TrainingTrendChart({
  data,
  metric,
  onMetricChange,
}: Props) {
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');

  const muscleGroups = [
    ...new Set(
      data.flatMap((point) =>
        Object.keys(point.muscleGroupVolumes ?? {})
      )
    ),
  ].sort((a, b) => a.localeCompare(b));

  const activeMuscleGroup =
    muscleGroups.find((group) => group === selectedMuscleGroup) ??
    muscleGroups[0] ??
    '';

  const getValue = (point: MonthlyTrendPoint): number => {
    switch (metric) {
      case 'totalVolume':
        return point.totalVolume ?? 0;

      case 'workoutCount':
        return point.workoutCount ?? 0;

      case 'muscleGroupVolume':
        return activeMuscleGroup
          ? point.muscleGroupVolumes?.[activeMuscleGroup] ?? 0
          : 0;
    }
  };

  const values = data.map(getValue);
  const maxValue = Math.max(...values, 1);
  const peakValue = Math.max(...values, 0);
  const hasData = values.some((value) => value > 0);

  const width = 640;
  const height = 240;
  const left = 24;
  const right = 18;
  const top = 18;
  const bottom = 42;
  const chartHeight = height - top - bottom;
  const chartWidth = width - left - right;

  const points = data.map((point, index) => {
    const value = getValue(point);

    const x =
      left +
      (data.length > 1
        ? (index / (data.length - 1)) * chartWidth
        : chartWidth / 2);

    const y = top + chartHeight - (value / maxValue) * chartHeight;

    return {
      x,
      y,
      month: point.month,
      value,
    };
  });

  const linePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(' ');

  const heading =
    metric === 'muscleGroupVolume' && activeMuscleGroup
      ? `${activeMuscleGroup} Volume (Last 6 Months)`
      : `${metricLabels[metric]} (Last 6 Months)`;

  return (
    <Card className="flex min-h-[350px] flex-col p-5 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-subtle">
          {heading}
        </h2>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={metric}
            onChange={(event) =>
              onMetricChange(event.target.value as ChartMetric)
            }
            className="cursor-pointer rounded-lg border border-border bg-background p-2 text-xs font-bold text-muted focus:border-accent focus:outline-none"
          >
            <option value="totalVolume">Total Volume</option>
            <option value="workoutCount">Workout Count</option>
            <option value="muscleGroupVolume">
              Volume by Muscle Group
            </option>
          </select>

          {metric === 'muscleGroupVolume' && (
            <select
              value={activeMuscleGroup}
              onChange={(event) =>
                setSelectedMuscleGroup(event.target.value)
              }
              disabled={muscleGroups.length === 0}
              className="cursor-pointer rounded-lg border border-border bg-background p-2 text-xs font-bold text-muted focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {muscleGroups.length === 0 ? (
                <option value="">No muscle groups</option>
              ) : (
                muscleGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))
              )}
            </select>
          )}
        </div>
      </div>

      {hasData ? (
        <div className="flex-1">
          <p className="mb-2 text-xs text-muted">
            Peak:{' '}
            <span className="font-bold text-foreground">
              {formatNumber(peakValue)}
              {metric !== 'workoutCount' ? ' kg' : ' workouts'}
            </span>
          </p>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-64 w-full overflow-visible"
            role="img"
            aria-label={`${heading} chart`}
          >
            {[0, 1, 2, 3].map((line) => {
              const y = top + (chartHeight / 3) * line;

              return (
                <line
                  key={line}
                  x1={left}
                  y1={y}
                  x2={width - right}
                  y2={y}
                  className="stroke-border"
                  strokeWidth="1"
                  strokeDasharray="4 5"
                />
              );
            })}

            <polyline
              points={linePoints}
              className="fill-none stroke-accent"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point) => (
              <circle
                key={point.month}
                cx={point.x}
                cy={point.y}
                r="4"
                className="fill-accent"
              >
                <title>
                  {formatMonth(point.month)}: {formatNumber(point.value)}
                </title>
              </circle>
            ))}

            {points.map((point) => (
              <text
                key={`${point.month}-label`}
                x={point.x}
                y={height - 12}
                textAnchor="middle"
                className="fill-muted"
                fontSize="11"
              >
                {formatMonth(point.month)}
              </text>
            ))}
          </svg>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-background/50 p-8 text-center">
          <p className="text-sm text-muted">
            No data for this metric in the last six months.
          </p>
        </div>
      )}
    </Card>
  );
}