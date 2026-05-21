import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "secondary" | "success" | "warning" | "info";
  compact?: boolean;
}

const colorMap = {
  primary:   { icon: "bg-primary/10 text-primary",   border: "border-l-primary" },
  secondary: { icon: "bg-secondary/10 text-secondary", border: "border-l-secondary" },
  success:   { icon: "bg-green-500/10 text-green-600", border: "border-l-green-500" },
  warning:   { icon: "bg-amber-500/10 text-amber-600", border: "border-l-amber-500" },
  info:      { icon: "bg-blue-500/10 text-blue-600",   border: "border-l-blue-500" },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  color = "primary",
  compact = false,
}: StatCardProps) {
  const { icon: iconClass, border } = colorMap[color];

  return (
    <Card className={`hover:shadow-md transition-all duration-200 border-l-4 ${border}`}>
      <CardContent className={compact ? "p-4" : "p-5"}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
              {title}
            </p>
            <p className={`font-bold text-foreground leading-none ${compact ? "text-2xl" : "text-3xl"}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p className={`text-xs font-medium ${trend.isPositive ? "text-green-600" : "text-destructive"}`}>
                {trend.isPositive ? "+" : ""}{trend.value}% from last month
              </p>
            )}
          </div>
          <div className={`shrink-0 p-2.5 rounded-xl shadow-sm ${iconClass}`}>
            <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
