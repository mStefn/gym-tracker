import { Card } from '../ui/Card';

export interface MonthlyTrendPoint {
  month: string;
  totalVolume: number;
  workoutCount: number;
  chestVolume: number;
}

export type ChartMetric =
  | 'totalVolume'
  | 'workoutCount'
  | 'chestVolume';

interface Props {
  data: MonthlyTrendPoint[];
  metric: ChartMetric;
  onMetricChange: (metric: ChartMetric) => void;
}

const metricLabels: Record<ChartMetric, string> = {
  totalVolume: 'Total Volume',
  workoutCount: 'Workout Count',
  chestVolume: 'Chest Volume',
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonth(month: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
  }).format(new Date(`${month}-01T12:00:00`));
}

export default function TrainingTrendChart({
  data,
  metric,
  onMetricChange,
}: Props) {
  const values = data.map((point) => point[metric]);
  const maxValue = Math.max(...values, 1);
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
    const value = point[metric];

    const x =
      left +
      (data.length > 1 ? (index / (data.length - 1)) * chartWidth : chartWidth / 2);

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

  return (
    <Card className="flex min-h-[350px] flex-col p-5 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-subtle">
          Training Volume (Last 6 Months)
        </h2>

        <select
          value={metric}
          onChange={(event) =>
            onMetricChange(event.target.value as ChartMetric)
          }
          className="cursor-pointer rounded-lg border border-border bg-background p-2 text-xs font-bold text-muted focus:border-accent focus:outline-none"
        >
          <option value="totalVolume">Total Volume</option>
          <option value="workoutCount">Workout Count</option>
          <option value="chestVolume">Chest Volume</option>
        </select>
      </div>

      {hasData ? (
        <div className="flex-1">
          <p className="mb-2 text-xs text-muted">
            {metricLabels[metric]}:{' '}
            <span className="font-bold text-foreground">
              {formatNumber(Math.max(...values))}
            </span>
          </p>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-64 w-full overflow-visible"
            role="img"
            aria-label={`${metricLabels[metric]} over the last six months`}
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