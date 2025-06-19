import React, { useState } from "react";
import "./App.css";

// PUBLIC_INTERFACE
function App() {
  // FinanceGoals Tracker state
  const [goals, setGoals] = useState([]);
  const [goalForm, setGoalForm] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
    monthlyIncome: "",
    monthlySpending: "",
  });
  const [selectedGoalIndex, setSelectedGoalIndex] = useState(null);
  const [reminders, setReminders] = useState([]);

  // Helper function for date calculation
  function monthsBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    if (isNaN(d1) || isNaN(d2)) return 0;
    let months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 1 : months;
  }

  // PUBLIC_INTERFACE
  function handleGoalFormChange(e) {
    setGoalForm({ ...goalForm, [e.target.name]: e.target.value });
  }

  // PUBLIC_INTERFACE
  function handleGoalFormSubmit(e) {
    e.preventDefault();
    if (
      !goalForm.name ||
      !goalForm.targetAmount ||
      !goalForm.targetDate ||
      !goalForm.monthlyIncome ||
      !goalForm.monthlySpending
    )
      return;
    const targetAmount = parseFloat(goalForm.targetAmount);
    const monthlyIncome = parseFloat(goalForm.monthlyIncome);
    const monthlySpending = parseFloat(goalForm.monthlySpending);
    const today = new Date();
    const monthsToGoal = monthsBetween(today, goalForm.targetDate);
    // Smart Contribution Calculation
    const maxCanSave = Math.max(
      0,
      Math.round(
        ((monthlyIncome - monthlySpending) * monthsToGoal + Number.EPSILON) * 100
      ) / 100
    );
    // Planner: Even split of the target amount across months (minimum suggested)
    const minMonthlySave = Math.ceil((targetAmount / monthsToGoal) * 100) / 100;
    const suggested = Math.min(minMonthlySave, monthlyIncome - monthlySpending);
    const goalObj = {
      name: goalForm.name,
      targetAmount,
      targetDate: goalForm.targetDate,
      monthlyIncome,
      monthlySpending,
      savedAmount: 0,
      status: "active",
      monthsToGoal,
      minMonthlySave,
      maxCanSave,
      suggested,
      microSavings: [],
      milestones: generateMilestones(targetAmount),
      remindersSet: false,
    };
    setGoals([...goals, goalObj]);
    setGoalForm({
      name: "",
      targetAmount: "",
      targetDate: "",
      monthlyIncome: "",
      monthlySpending: "",
    });
    setSelectedGoalIndex(goals.length);
  }

  // PUBLIC_INTERFACE
  function handleAddMicroSaving(goalIdx, value) {
    if (!value || isNaN(value) || value <= 0) return;
    const updatedGoals = goals.map((g, idx) => {
      if (idx === goalIdx) {
        const newMicroSavings = [...g.microSavings, parseFloat(value)];
        const newSaved = newMicroSavings.reduce((a, b) => a + b, 0);
        const cappedSaved = Math.min(newSaved, g.targetAmount);
        let newStatus = g.status;
        if (cappedSaved >= g.targetAmount) newStatus = "achieved";
        return {
          ...g,
          microSavings: newMicroSavings,
          savedAmount: cappedSaved,
          status: newStatus,
        };
      }
      return g;
    });
    setGoals(updatedGoals);
  }

  // PUBLIC_INTERFACE
  function handleSetReminder(goalIdx) {
    const goal = goals[goalIdx];
    const today = new Date();
    const deadline = new Date(goal.targetDate);

    // Simulated reminder schedule based on deadline (every 7 days until due)
    const remindersArr = [];
    let nextReminder = new Date(today.getTime());
    while (nextReminder < deadline) {
      remindersArr.push(
        `Reminder for "${goal.name}": Save more before ${deadline
          .toISOString()
          .slice(0, 10)}`
      );
      nextReminder.setDate(nextReminder.getDate() + 7);
    }
    setReminders((prev) => [...prev, ...remindersArr]);
    // Mark as reminders set, only allow once per goal
    const updatedGoals = goals.map((g, idx) =>
      idx === goalIdx ? { ...g, remindersSet: true } : g
    );
    setGoals(updatedGoals);
  }

  // Helper to get progress percent
  function getGoalProgress(goal) {
    return Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
  }

  // Helper for auto milestone generation (25%, 50%, 75%, 100%)
  function generateMilestones(targetAmount) {
    return [
      Math.ceil(targetAmount * 0.25),
      Math.ceil(targetAmount * 0.5),
      Math.ceil(targetAmount * 0.75),
      Math.ceil(targetAmount * 1),
    ];
  }

  function handleSelectGoal(idx) {
    setSelectedGoalIndex(idx);
  }

  function handleCompleteGoal(idx) {
    // Allow user to manually mark as done if desired
    setGoals(
      goals.map((g, i) =>
        i === idx ? { ...g, savedAmount: g.targetAmount, status: "achieved" } : g
      )
    );
  }

  function handlePrioritize(idx) {
    // Move goal to top (higher priority)
    if (idx === 0) return;
    const reordered = [...goals];
    const [goalObj] = reordered.splice(idx, 1);
    reordered.unshift(goalObj);
    setGoals(reordered);
    setSelectedGoalIndex(0);
  }

  // Styles (palette from requirements)
  const palette = {
    primary: "#4CAF50",
    secondary: "#FFC107",
    accent: "#2196F3",
    white: "#fff",
    bg: "#f7fafb",
    text: "#212121",
    gray: "#dee2e6",
    shadow: "0 0 12px rgba(44,62,80,0.10)",
  };

  // PUBLIC_INTERFACE
  function GoalCard({ goal, idx, selected, onSelect, onPrioritize, onComplete }) {
    const progress = getGoalProgress(goal);
    const active = goal.status === "active";
    return (
      <div
        className="goal-card"
        style={{
          background: palette.white,
          boxShadow: palette.shadow,
          border:
            selected || progress === 100
              ? `2px solid ${palette.primary}`
              : `1px solid ${palette.gray}`,
          opacity: active ? 1 : 0.6,
          transition: "box-shadow 0.16s, border 0.25s",
        }}
        onClick={() => onSelect(idx)}
      >
        <div className="goal-card-header">
          <strong style={{ color: palette.text, fontSize: "1.05rem" }}>
            {goal.name}
          </strong>
          <span className="tag" style={{ background: palette.accent }}>
            {active ? "Active" : "Done"}
          </span>
        </div>
        <div className="goal-details">
          <div>
            Target: <b>₹{goal.targetAmount}</b>
            <span style={{ marginLeft: 10, color: palette.secondary, fontSize: 13 }}>
              by {goal.targetDate}
            </span>
          </div>
        </div>
        <div className="goal-progress-bar-wrap">
          <div
            className="goal-progress-bar"
            style={{
              width: `${progress}%`,
              background: palette.primary,
              height: 8,
              borderRadius: 4,
              transition: "width 0.45s",
            }}
          ></div>
          <div className="goal-progress-bg" />
        </div>
        <div
          style={{
            fontSize: 13,
            margin: "4px 0 5px 0",
            color: palette.text,
          }}
        >
          {progress < 100 ? (
            <span>
              Saved: <b>₹{goal.savedAmount}</b> ({progress.toFixed(0)}%)
            </span>
          ) : (
            <span style={{ color: palette.primary }}>
              Goal reached: <b>₹{goal.targetAmount}</b> 🎉
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 13,
            color: palette.gray,
            marginBottom: 10,
            marginTop: 5,
          }}
        >
          Min/Recommended Monthly: <b>₹{goal.minMonthlySave}</b> /{" "}
          <b>₹{goal.suggested}</b>
        </div>
        <div className="goal-card-actions">
          <button
            className="mini-btn"
            style={{ background: palette.primary }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(idx);
            }}
          >
            View
          </button>
          <button
            className="mini-btn"
            style={{ background: palette.secondary, color: palette.text }}
            onClick={(e) => {
              e.stopPropagation();
              onPrioritize(idx);
            }}
            title="Prioritize goal"
            disabled={idx === 0}
          >
            ↑
          </button>
          <button
            className="mini-btn"
            style={{ background: palette.accent, color: "#fff" }}
            onClick={(e) => {
              e.stopPropagation();
              onComplete(idx);
            }}
            disabled={progress === 100}
            title="Mark as done"
          >
            ✔
          </button>
        </div>
      </div>
    );
  }

  // PUBLIC_INTERFACE
  function GoalDetails({ goal, onAddMicroSaving, onSetReminder, disableReminder }) {
    const [savingInput, setSavingInput] = useState("");

    const handleAdd = () => {
      onAddMicroSaving(savingInput);
      setSavingInput("");
    };

    return (
      <div className="goal-details-area">
        <h2 style={{ color: palette.primary, fontWeight: 600, paddingBottom: 6 }}>
          {goal.name}
        </h2>
        <div style={{ fontSize: "1.09rem" }}>
          Target: <b>₹{goal.targetAmount}</b> by <b>{goal.targetDate}</b>
        </div>
        <div style={{ fontSize: 14, color: palette.text, margin: "3px 0 0 0" }}>
          Goal progress:
          <span style={{ marginLeft: 8, color: palette.primary }}>
            {((goal.savedAmount / goal.targetAmount) * 100).toFixed(0)}%
          </span>
        </div>
        <ProgressMilestones
          saved={goal.savedAmount}
          milestones={goal.milestones}
          target={goal.targetAmount}
          palette={palette}
        />
        <div className="goal-habit-row">
          <input
            type="number"
            min="1"
            value={savingInput}
            onChange={(e) => setSavingInput(e.target.value)}
            placeholder="Quick micro-save (₹)"
            style={{
              padding: "7px 13px",
              borderRadius: 4,
              border: `1px solid ${palette.gray}`,
              fontSize: 15,
              marginRight: 8,
              outline: "none",
              width: 120,
            }}
            disabled={goal.status !== "active"}
          />
          <button
            className="btn"
            style={{
              background: palette.primary,
              color: "#fff",
              fontSize: 15,
              padding: "6px 14px",
            }}
            onClick={handleAdd}
            disabled={goal.status !== "active"}
          >
            + Add
          </button>
          <button
            className="btn"
            onClick={onSetReminder}
            style={{
              marginLeft: 8,
              background: palette.accent,
              color: "#fff",
              fontSize: 15,
              padding: "6px 14px",
            }}
            disabled={disableReminder}
            title="Enable weekly push reminders (simulated)"
          >
            {disableReminder ? "Reminders On" : "Set Reminder"}
          </button>
        </div>
        <div
          style={{
            fontSize: 14,
            color: palette.secondary,
            margin: "8px 0",
            fontStyle: "italic",
          }}
        >
          <b>Tip:</b> Use micro-save to build habits – no real money handled!
        </div>
        <div
          style={{
            fontSize: 13,
            color: palette.text,
            margin: "10px 0 2px 0",
            fontWeight: 500,
          }}
        >
          Micro-savings:
        </div>
        <div className="goal-micro-savings-list">
          {goal.microSavings.length === 0 ? (
            <span style={{ color: "#999" }}>No savings yet.</span>
          ) : (
            <ul style={{ padding: 0, margin: 0 }}>
              {goal.microSavings.map((amt, i) => (
                <li
                  key={i}
                  style={{
                    listStyle: "none",
                    fontSize: 15,
                    marginBottom: 2,
                    color: palette.text,
                  }}
                >
                  + ₹{amt}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // PUBLIC_INTERFACE
  function ProgressMilestones({ saved, milestones, target, palette }) {
    // Visual progress bar & milestones
    const percent = Math.min((saved / target) * 100, 100);
    return (
      <div className="goal-progress-milestones">
        <div
          style={{
            width: "100%",
            background: "#eee",
            height: 16,
            borderRadius: 8,
            margin: "16px 0 6px 0",
            position: "relative",
          }}
        >
          <div
            style={{
              background: palette.primary,
              height: "100%",
              width: `${percent}%`,
              borderRadius: 8,
              transition: "width 0.45s",
            }}
          />
          {/* Milestone marks */}
          {milestones.map((milestone, idx) => (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: `${((milestone / target) * 100).toFixed(2)}%`,
                top: 0,
                height: 16,
                width: 2,
                background: palette.accent,
                borderRadius: 2,
                transform: "translateX(-1px)",
              }}
              title={`Milestone: ₹${milestone}`}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            marginTop: -7,
            color: palette.text,
          }}
        >
          <span>0</span>
          <span>₹{target}</span>
        </div>
      </div>
    );
  }

  // PUBLIC_INTERFACE
  function ReminderList() {
    // Simulate notification area (not real push notifications)
    return (
      <div
        style={{
          background: palette.secondary,
          color: palette.text,
          padding: "10px 24px",
          borderRadius: 8,
          margin: "0 auto 20px auto",
          maxWidth: 600,
          fontSize: 15,
        }}
      >
        <b>Reminders:</b>
        <ul style={{ margin: 0, paddingLeft: 22 }}>
          {reminders.map((r, i) => (
            <li key={i} style={{ fontWeight: 400 }}>
              {r}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Main UI render
  return (
    <div
      className="app"
      style={{
        minHeight: "100vh",
        background: palette.bg,
        color: palette.text,
      }}
    >
      <nav className="navbar" style={{ background: palette.white, borderBottom: "1px solid #eee" }}>
        <div className="container" style={{ maxWidth: 1060 }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <div className="logo" style={{ color: palette.primary }}>
              <span className="logo-symbol" style={{ color: palette.accent }}>
                💰
              </span>{" "}
              FinanceGoals Tracker
            </div>
            <a
              href="https://kavia.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                background: palette.accent,
                color: "#fff",
                fontWeight: 600,
              }}
            >
              About Kavia
            </a>
          </div>
        </div>
      </nav>

      <main style={{ paddingTop: 110 }}>
        <div className="container" style={{ maxWidth: 950, marginBottom: 64 }}>
          {/* Hero section */}
          <div className="hero" style={{ alignItems: "flex-start", gap: 8, paddingTop: 16, paddingBottom: 36 }}>
            <div className="subtitle" style={{ color: palette.accent, fontWeight: 500, fontSize: 18 }}>
              Personal Finance Goal Planner
            </div>
            <h1 className="title" style={{ color: palette.primary, fontSize: "2.5rem", marginBottom: 0 }}>
              Track, Save, and Achieve – All Virtually
            </h1>
            <div
              className="description"
              style={{
                color: palette.text,
                fontSize: "1.12rem",
                marginBottom: 10,
                marginTop: 7,
                maxWidth: 650,
              }}
            >
              Set, plan, and track your savings goals. Smart recommendations, habit micro-savings, and milestone progress –{" "}
              <span style={{ color: palette.secondary }}>no bank or UPI link required</span>.
            </div>
          </div>

          {/* Add goal form */}
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              boxShadow: palette.shadow,
              padding: 28,
              marginBottom: 40,
              maxWidth: 650,
              margin: "0 auto 32px auto",
            }}
          >
            <form
              className="goal-form"
              onSubmit={handleGoalFormSubmit}
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "1fr 1fr",
                alignItems: "end",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500, color: palette.primary }}>Goal Name</label>
                <input
                  type="text"
                  name="name"
                  value={goalForm.name}
                  onChange={handleGoalFormChange}
                  placeholder="e.g., New Bike"
                  style={inputStyle(palette)}
                  required
                  maxLength={32}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500, color: palette.primary }}>Target Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  name="targetAmount"
                  value={goalForm.targetAmount}
                  onChange={handleGoalFormChange}
                  placeholder="10000"
                  style={inputStyle(palette)}
                  required
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500, color: palette.primary }}>Target Date</label>
                <input
                  type="date"
                  name="targetDate"
                  value={goalForm.targetDate}
                  onChange={handleGoalFormChange}
                  style={inputStyle(palette)}
                  required
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500, color: palette.primary }}>Monthly Income (₹)</label>
                <input
                  type="number"
                  min="1"
                  name="monthlyIncome"
                  value={goalForm.monthlyIncome}
                  onChange={handleGoalFormChange}
                  placeholder="25000"
                  style={inputStyle(palette)}
                  required
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500, color: palette.primary }}>Monthly Spending (₹)</label>
                <input
                  type="number"
                  min="0"
                  name="monthlySpending"
                  value={goalForm.monthlySpending}
                  onChange={handleGoalFormChange}
                  placeholder="18000"
                  style={inputStyle(palette)}
                  required
                />
              </div>
              <div style={{ alignSelf: "end" }}>
                <button
                  className="btn btn-large"
                  style={{
                    background: palette.primary,
                    color: "#fff",
                    fontWeight: 600,
                    width: "100%",
                    fontSize: 17,
                  }}
                  type="submit"
                >
                  + Add Goal
                </button>
              </div>
            </form>
          </div>

          {/* Show reminders notification area (simulated) */}
          {reminders.length > 0 && <ReminderList />}

          {/* Goals list and detail */}
          <div
            className="goals-list-section"
            style={{
              display: "grid",
              gridTemplateColumns: goals.length > 0 ? "1.13fr 1.15fr" : "1fr",
              gap: 26,
              alignItems: "flex-start",
              marginTop: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h2 style={{ color: palette.accent, marginBottom: 17, fontSize: 21 }}>
                Your Goals ({goals.length || "none"})
              </h2>
              {/* Multiple Goals Management */}
              {goals.length === 0 ? (
                <div style={{ color: "#888", fontStyle: "italic" }}>
                  No goals set. Add your first financial goal!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {goals.map((goal, idx) => (
                    <GoalCard
                      goal={goal}
                      idx={idx}
                      key={goal.name + idx}
                      selected={selectedGoalIndex === idx}
                      onSelect={handleSelectGoal}
                      onPrioritize={handlePrioritize}
                      onComplete={handleCompleteGoal}
                    />
                  ))}
                </div>
              )}
            </div>
            {/* Show selected goal details */}
            <div style={{ minWidth: 0 }}>
              {selectedGoalIndex != null && goals[selectedGoalIndex] ? (
                <GoalDetails
                  goal={goals[selectedGoalIndex]}
                  onAddMicroSaving={(amt) => handleAddMicroSaving(selectedGoalIndex, amt)}
                  onSetReminder={() => handleSetReminder(selectedGoalIndex)}
                  disableReminder={goals[selectedGoalIndex].remindersSet}
                />
              ) : (
                <div
                  style={{
                    fontStyle: "italic",
                    color: "#888",
                    marginTop: 55,
                    fontSize: 17,
                    textAlign: "center",
                  }}
                >
                  Select any goal to view details, add micro-savings,
                  get reminders, and track your progress.
                </div>
              )}
            </div>
          </div>

          {/* No banking link notice */}
          <div style={{ marginTop: 40 }}>
            <div
              style={{
                color: palette.gray,
                fontSize: 14,
                letterSpacing: "0.01em",
                background: "#fff",
                borderRadius: 7,
                minHeight: 38,
                padding: "7px 18px",
                textAlign: "center",
                boxShadow: palette.shadow,
                maxWidth: 500,
                margin: "0 auto",
              }}
            >
              <b>Privacy-first:</b> This app is a virtual tracker only. <b>No</b> bank, UPI, or account link required.
            </div>
          </div>
        </div>
      </main>
      <style>{customStyles(palette)}</style>
    </div>
  );
}

// Helper for consistent input styling
function inputStyle(palette) {
  return {
    border: `1px solid ${palette.gray}`,
    borderRadius: 5,
    padding: "9px 12px",
    fontSize: 15,
    color: palette.text,
    background: "#f9fafd",
    marginTop: 3,
    marginBottom: 0,
    outline: "none",
    boxSizing: "border-box",
  };
}

// Additional scoped styles for goal cards and progress bars
function customStyles(palette) {
  return `
    .goal-card {
      padding: 18px 22px 13px 18px;
      border-radius: 12px;
      margin-bottom: 2px;
      cursor: pointer;
      transition: box-shadow 0.16s;
      min-width: 0;
      margin-right: 3px;
      margin-top: 0;
      position: relative;
      overflow: hidden;
    }
    .goal-card:hover {
      box-shadow: 0 2px 22px rgba(60,130,240,0.08);
    }
    .goal-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .goal-card .tag {
      font-size: 0.82em;
      color: #fff;
      padding: 1px 10px 2px 10px;
      border-radius: 7px;
      margin-left: 13px;
      font-weight: 500;
    }
    .goal-details {
      margin: 2px 0 8px 0;
      font-size: 1.03rem;
      color: #666;
    }
    .goal-progress-bar-wrap {
      background: #eee;
      height: 8px;
      border-radius: 4px;
      margin-top: 7px;
      margin-bottom: 4px;
      width: 100%;
      overflow: hidden;
      position: relative;
    }
    .goal-progress-bg {
      position: absolute;
      width: 100%;
      height: 8px;
      background: #eee;
      border-radius: 4px;
      left: 0; top: 0;
      z-index: 0;
    }
    .goal-card-actions {
      display: flex;
      gap: 7px;
      margin-top: 8px;
    }
    .mini-btn {
      border: none;
      outline: none;
      border-radius: 5px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      padding: 5px 12px;
      transition: background 0.15s, color 0.15s;
      min-width: 45px;
      margin-right: 2px;
    }
    .mini-btn:disabled {
      background: #eee !important;
      color: #999 !important;
      cursor: not-allowed;
      opacity: 0.68;
    }
    .goal-details-area {
      background: #fff;
      border-radius: 12px;
      padding: 23px 27px 17px 27px;
      box-shadow: ${palette.shadow};
      min-width: 0;
      min-height: 246px;
    }
    .goal-habit-row {
      display: flex;
      align-items: center;
      gap: 7px;
      margin: 15px 0 6px 0;
    }
    .goal-micro-savings-list {
      padding: 7px 0 0 0;
    }
    .goal-progress-milestones {
      margin: 0 0 4px 0;
    }
    @media (max-width: 900px) {
      .goals-list-section {
        grid-template-columns: 1fr !important;
      }
      .goal-details-area {
        margin-top: 30px;
      }
    }
    @media (max-width: 600px) {
      .goal-card,
      .goal-details-area {
        padding: 11px !important;
      }
    }
  `;
}

export default App;
