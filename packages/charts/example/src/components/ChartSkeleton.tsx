import { Skeleton } from "./ui/skeleton";

export function ChartSkeleton() {
  return (
    <div className="chart-skeleton" data-testid="chart-loading-skeleton">
      <div className="chart-skeleton__header">
        <Skeleton className="chart-skeleton__title" />
        <Skeleton className="chart-skeleton__legend" />
      </div>
      <div className="chart-skeleton__plot">
        <Skeleton className="chart-skeleton__axis chart-skeleton__axis--y" />
        <div className="chart-skeleton__bars" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((item) => (
            <Skeleton className={`chart-skeleton__bar chart-skeleton__bar--${item}`} key={item} />
          ))}
        </div>
      </div>
      <Skeleton className="chart-skeleton__axis chart-skeleton__axis--x" />
    </div>
  );
}
