import React from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer
} from "recharts";

/**
 * PUBLIC_INTERFACE
 * PieChartGoalProgress component to visualize goals progress as a large, styled pie chart.
 * @param {Array} goals - Array of goal objects [{id, name, currentAmount, targetAmount, category}, ...]
 */
function PieChartGoalProgress({ goals }) {
  // Filter goals that have positive targetAmount and a name
  const filteredGoals = goals.filter(g => !!g.name && Number(g.targetAmount) > 0);

  // Compose pie chart data: value is percent progress (min: 1 for tiny goals)
  const data = filteredGoals.map((g) => {
    // Cap at 100 for completed, 0 for none
    let percent = 0;
    if (g.targetAmount > 0) {
      percent = Math.max(0, Math.min(100, (Number(g.currentAmount) / Number(g.targetAmount)) * 100));
    }
    // If every value is 0, pies can't render, so minimum 1 for presence
    return {
      name: g.name,
      value: percent > 0 ? percent : 1,
      category: g.category,
      remaining: Math.max(0, 100 - percent),
      color: null, // will set below
    };
  });

  // Use Goalie colors from CSS variables as the palette
  const palette = [
    "var(--primary-color)",
    "var(--accent-color)",
    "var(--secondary-color)",
    "#9477EE",
    "#4e8cff",
    "#7B88A1",
    "#F3E6FF",
    "#F4D35E"
  ];

  // Assign a color per slice/goal, falling back to palette cycle
  data.forEach((item, idx) => {
    item.color = palette[idx % palette.length];
  });

  // Custom tooltip content for modern look: goal name and percent
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const goal = payload[0].payload;
      return (
        <div
          style={{
            background: "white",
            borderRadius: 10,
            border: "1.5px solid var(--border-color)",
            padding: "13px 19px",
            boxShadow: "0 4px 24px #d8d6fc49",
            fontWeight: 500,
            color: "var(--primary-color)",
            minWidth: 160,
            textAlign: "center"
          }}
        >
          <span style={{ fontSize: "1.09em", fontWeight: 600, color: "var(--primary-color)" }}>
            {goal.name}
          </span>
          <br />
          <span style={{ color: "#6b69a3", fontSize: "0.99em" }}>
            Category: {goal.category || "—"}
          </span>
          <br />
          <span style={{ fontSize: "1.17em", color: "var(--accent-color)", fontWeight: 700 }}>
            {Math.round(goal.value)}% complete
          </span>
        </div>
      );
    }
    return null;
  };

  // If no goals, show an empty state
  if (data.length === 0) {
    return (
      <div style={{
        margin: "0 auto",
        marginBottom: 32,
        marginTop: 46,
        background: "rgba(243,230,255,0.72)",
        borderRadius: 16,
        padding: "32px 0",
        maxWidth: 480,
        boxShadow: "0 1.5px 13px #d8d6fc39, 0 2px 8px #e7eaf9"
      }}>
        <h3 style={{ color: "var(--primary-color)", fontWeight: 700, fontSize: "1.25em", margin: 0 }}>
          Your goals will appear here as a chart!
        </h3>
        <span style={{ color: "var(--text-secondary)", fontSize: "1em" }}>
          Add a savings goal to get started.
        </span>
      </div>
    );
  }

  // Render a large, responsive, aesthetic pie chart
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 530,
        minWidth: 270,
        margin: "0 auto",
        marginTop: 56,
        marginBottom: 50,
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 8.5px 28px 0 #d8d6fc45, 0 2px 7px #e6ebf6a8",
        padding: "32px 17px 21px 17px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
      className="goals-progress-pie"
      aria-label="Overall Goals Progress PieChart"
    >
      <div style={{
        fontWeight: 700,
        fontSize: "1.23em",
        color: "var(--primary-color)",
        letterSpacing: "0.9px",
        marginBottom: 8
      }}>
        Progress Overview
      </div>
      <ResponsiveContainer width="100%" height={290}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            innerRadius={65}
            stroke="#fff"
            strokeWidth={5}
            isAnimationActive={true}
            label={({ name, value }) =>
              `${Math.round(value)}%`
            }
            labelLine={false}
            // style slice hover cursor pointer
            style={{ cursor: "pointer" }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getComputedStyle(document.documentElement).getPropertyValue(
                  entry.color.startsWith("var")
                    ? entry.color
                    : null
                ) || entry.color || "#4e8cff"}
                style={{ filter: "drop-shadow(0 1.2px 7px #8b89bb19)" }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        fontSize: "0.98em",
        color: "var(--text-secondary)",
        marginTop: -8
      }}>
        Hover a slice to see the matching goal
      </div>
    </div>
  );
}

export default PieChartGoalProgress;
