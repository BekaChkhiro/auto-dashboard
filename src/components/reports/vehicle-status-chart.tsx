'use client'

import * as React from 'react'
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { VehicleStatusDistribution } from '@/lib/actions/reports'
import { cn } from '@/lib/utils'

interface VehicleStatusChartProps {
  data: VehicleStatusDistribution[]
  className?: string
}

export function VehicleStatusChart({ data, className }: VehicleStatusChartProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className={cn('flex items-center justify-center h-[300px]', className)}>
        <p className="text-muted-foreground">No vehicle data available</p>
      </div>
    )
  }

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: d.statusName,
      value: d.count,
      color: d.statusColor || '#6b7280',
      percentage: d.percentage,
    }))

  return (
    <div className={cn('h-[300px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percentage }) => `${name} (${percentage}%)`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: data.color }}
                      />
                      <span className="font-medium">{data.name}</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {data.value} vehicles ({data.percentage}%)
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            content={({ payload }) => (
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                {payload?.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
