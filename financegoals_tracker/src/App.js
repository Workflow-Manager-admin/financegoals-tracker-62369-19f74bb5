import React, { useState, useEffect } from "react";
import "./App.css";

// PUBLIC_INTERFACE
function App() {
  // --- STATE MANAGEMENT ---
  const [goals, setGoals] = useState(() => {
    // Load from localStorage (virtual piggybank: persists state)
    const stored = localStorage.getItem("financegoals_goals");
    return stored ? JSON.parse(stored) : [];
  });
  const [reminders, setReminders] = useState([]); // for habit reminders
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Save goals to localStorage on change
  useEffect(() => {
    localStorage.setItem("financegoals_goals", JSON.stringify(goals));
  }, [goals]);

  // --- REMINDER SYSTEM (Micro-Habit) ---
  useEffect(() => {
    // For demo: show a random, encouraging reminder roughly every 45s
    const habitTips = [
      "Tip: Add even tiny amounts for steady progress!",
      "Keep up the streak – save something today!",
      "Set a reminder for your next planned contribution.",
      "Check your progress! You’re closer than you think.",
      "Don’t forget your goals – your future thanks you!"
    ];
    const interval = setInterval(() => {
      const msg = habitTips[Math.floor(Math.random() * habitTips.length)];
      setReminders(r =>
        [...r, { id: Date.now(), message: msg }].slice(-3)
      );
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // --- GOAL OPERATIONS ---
  // PUBLIC_INTERFACE
  function handleAddGoal(goal) {
    setGoals([
      ...goals,
      {
        ...goal,
        id: Date.now(),
        currentAmount: 0,
        // For future: add createdAt, habit logs
      }
    ]);
    setShowGoalForm(false);
  }
  // PUBLIC_INTERFACE
  function handleUpdateGoal(updated) {
    setGoals(
      goals.map(g => (g.id === updated.id ? { ...updated } : g))
    );
    setEditingGoal(null);
  }
  // PUBLIC_INTERFACE
  function handleDeleteGoal(id) {
    setGoals(goals.filter(g => g.id !== id));
    if (editingGoal && editingGoal.id === id) setEditingGoal(null);
  }

  // PUBLIC_INTERFACE
  function handleContribute(goalId, amount) {
    // For smart calculator: ensure positive amounts and cap at goal
    setGoals(goals =>
      goals.map(goal => {
        if (goal.id === goalId) {
          const newAmt =
            Math.min(
              goal.currentAmount + Number(amount),
              Number(goal.targetAmount)
            );
          return { ...goal, currentAmount: newAmt };
        }
        return goal;
      })
    );
  }

  // --- RENDER ---
  return (
    <div className="app" style={{ background: "#f7fafb" }}>
      <nav className="navbar fg-navbar">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <div className="logo fg-logo">
              <span className="logo-symbol">💰</span> FinanceGoals Tracker
            </div>
            <button className="btn" style={{
              background: "var(--primary-color)"
            }} onClick={() => setShowGoalForm(true)}>
              + Add Goal
            </button>
          </div>
        </div>
      </nav>

      <main className="fg-main-panel">
        <div className="container">
          {/* Habit Reminder Notifications */}
          <div className="fg-reminders">
            {reminders.map(r => (
              <NotificationCard key={r.id} message={r.message} />
            ))}
          </div>

          {/* Heading */}
          <div className="hero" style={{paddingTop: 96, paddingBottom: 24}}>
            <div className="subtitle" style={{color:"var(--accent-color)"}}>
              Plan. Save. Achieve.
            </div>
            <h1 className="title" style={{
              fontSize: "2.2rem", color: "var(--primary-color)",
              margin: 0, fontWeight: 700
            }}>
              Your Virtual Piggybank for Goals 🎯
            </h1>
            <div className="description" style={{color: "#444", maxWidth: 400}}>
              Set, manage and track your financial goals. See your progress, build habits, and become your best financial self.
            </div>
          </div>

          {/* Goal Cards */}
          <div className="fg-goal-list">
            {goals.length === 0 && (
              <div className="fg-empty-state">
                <p>No goals yet! Start by adding one above.</p>
              </div>
            )}
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => { setEditingGoal(goal); setShowGoalForm(true); }}
                onDelete={() => handleDeleteGoal(goal.id)}
                onContribute={handleContribute}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Goal Form Modal */}
      {showGoalForm && (
        <GoalFormModal
          editing={Boolean(editingGoal)}
          defaultGoal={editingGoal}
          onSubmit={editingGoal ? handleUpdateGoal : handleAddGoal}
          onClose={() => { setShowGoalForm(false); setEditingGoal(null); }}
        />
      )}
    </div>
  );
}

// --- Notification Card ---
function NotificationCard({ message }) {
  return (
    <div className="fg-notification-card">
      <span role="img" aria-label="reminder">⏰</span> {message}
    </div>
  );
}

// --- Goal Card Component ---
// PUBLIC_INTERFACE
function GoalCard({ goal, onEdit, onDelete, onContribute }) {
  // Smart suggestion:
  const [smartAmount, setSmartAmount] = useState(() =>
    smartSuggestedContribution(goal)
  );
  const [inputAmt, setInputAmt] = useState("");

  // Mini calculator updates smart suggestion if the goal changes
  useEffect(() => {
    setSmartAmount(smartSuggestedContribution(goal));
  }, [goal]);

  // Progress (% complete)
  const progress = Math.min(
    (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100,
    100
  );

  // Days left to goal date
  const today = new Date();
  const deadline = new Date(goal.deadline);
  const daysLeft =
    Math.max(0, Math.ceil((+deadline - +today) / (1000 * 60 * 60 * 24)));

  // PUBLIC_INTERFACE
  function handleQuickContribute(e) {
    e.preventDefault();
    const amt =
      inputAmt !== "" ? Number(inputAmt) : Number(smartAmount);
    if (isNaN(amt) || amt <= 0) return;
    onContribute(goal.id, amt);
    setInputAmt("");
  }

  return (
    <div className="fg-goal-card">
      <div className="fg-goal-main">
        <h2 className="fg-goal-title">{goal.name}</h2>
        <span className="fg-goal-category">{goal.category}</span>
        <button className="fg-goal-editbtn" title="Edit" onClick={onEdit}>✏️</button>
        <button className="fg-goal-deletebtn" title="Delete" onClick={onDelete}>🗑️</button>
      </div>
      <div className="fg-progress-row">
        <ProgressBar percent={progress} />
        <span className="fg-progress-label">
          {formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}
        </span>
      </div>
      <div className="fg-goal-dates">
        <span className="fg-goal-deadline">
          {daysLeft} {daysLeft===1?"day":"days"} left
        </span>
      </div>
      {/* Contribution Calculator */}
      <form className="fg-contribute-form" onSubmit={handleQuickContribute}>
        <input
          className="fg-contribute-input"
          type="number"
          min="1"
          step="any"
          placeholder={`Save (₹)...`}
          style={{borderColor: "var(--primary-color)"}}
          value={inputAmt}
          onChange={e => setInputAmt(e.target.value)}
        />
        <button className="btn" style={{
          background: "var(--accent-color)",
          color: "#fff"
        }}>
          Contribute {inputAmt !== "" ? formatMoney(inputAmt) : formatMoney(smartAmount)}
        </button>
      </form>
      {/* Smart Suggestion */}
      <div className="fg-smart-suggestion">
        Smart Suggestion: Save <b>{formatMoney(smartAmount)}</b> {daysLeft ? "per day" : "today"} to reach your goal.
      </div>
    </div>
  );
}

// --- Progress Bar ---
function ProgressBar({ percent }) {
  return (
    <div className="fg-progress-bar-outer">
      <div
        className="fg-progress-bar-inner"
        style={{
          width: `${percent}%`,
          background:
            percent >= 100
              ? "var(--secondary-color)"
              : "var(--primary-color)",
          transition: "width 0.6s cubic-bezier(.77,0,.18,1)"
        }}
      />
    </div>
  );
}

// --- Goal Form Modal ---
// PUBLIC_INTERFACE
function GoalFormModal({ editing, defaultGoal, onSubmit, onClose }) {
  const [form, setForm] = useState(() =>
    defaultGoal || {
      name: "",
      category: "",
      targetAmount: "",
      deadline: "",
      currentAmount: 0
    }
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.targetAmount ||
      !form.deadline
    )
      return;
    onSubmit({
      ...defaultGoal,
      ...form,
      targetAmount: Number(form.targetAmount),
      currentAmount: editing ? Number(form.currentAmount) : 0
    });
    // modal closes via parent
  }

  return (
    <div className="fg-modal">
      <div className="fg-modal-content">
        <h2>{editing ? "Edit Goal" : "New Goal"}</h2>
        <form onSubmit={handleSubmit} className="fg-goal-form">
          <label>
            Goal Name *
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              maxLength={40}
            />
          </label>
          <label>
            Category
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              maxLength={24}
              placeholder="(eg. Vacation, Emergency...)"
            />
          </label>
          <label>
            Target Amount (₹) *
            <input
              type="number"
              name="targetAmount"
              required
              min="1"
              value={form.targetAmount}
              onChange={handleChange}
            />
          </label>
          <label>
            Deadline *
            <input
              type="date"
              name="deadline"
              required
              value={form.deadline}
              min={new Date().toISOString().slice(0, 10)}
              onChange={handleChange}
            />
          </label>
          {editing && (
            <label>
              Already Saved (₹)
              <input
                type="number"
                name="currentAmount"
                min="0"
                value={form.currentAmount}
                onChange={handleChange}
              />
            </label>
          )}
          <div className="fg-modal-actions">
            <button type="submit" className="btn" style={{background:"var(--primary-color)"}}>{editing ? "Update" : "Add Goal"}</button>
            <button type="button" className="btn" style={{background:"#bbb",color:"#333"}} onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
      <div className="fg-modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

// --- UTILITY FUNCTIONS ---

// PUBLIC_INTERFACE
function smartSuggestedContribution(goal) {
  // Recommend a per-day saving so you hit the goal
  if (!goal || !goal.targetAmount || !goal.deadline) return 0;
  const now = new Date();
  const deadline = new Date(goal.deadline);
  const daysLeft = Math.max(1, Math.ceil((+deadline - +now) / (1000 * 60 * 60 * 24)));
  const amountLeft = Math.max(0, Number(goal.targetAmount) - Number(goal.currentAmount));
  // Never suggest more than needed
  return Math.ceil(amountLeft / daysLeft);
}
function formatMoney(amount) {
  return "₹" + Number(amount).toLocaleString();
}

// --- COLOR CSS VARIABLES (override base) ---
const setRootPalette = () => {
  const root = document.documentElement;
  root.style.setProperty("--primary-color", "#4CAF50");
  root.style.setProperty("--secondary-color", "#FFC107");
  root.style.setProperty("--accent-color", "#2196F3");
};
setRootPalette();

// --- STYLES ---
// Card, progress, modal and UI element styles (for clarity and light theme)
const injectFGStyles = () => {
  if (document.getElementById("fg-styles")) return;
  const style = document.createElement("style");
  style.id = "fg-styles";
  style.innerHTML = `
  .fg-navbar {
    background: #fff !important;
    border-bottom: 1px solid #eaf1ed;
    color: #263238;
  }
  .fg-logo {
    color: var(--primary-color);
    font-weight: 700;
    letter-spacing: 0.5px;
    gap: 8px;
    opacity: 0.95;
  }
  .fg-main-panel {
    background: #f7fafb;
    min-height: 100vh;
    padding-bottom: 40px;
  }
  .fg-goal-list {
    margin: 36px auto 0 auto;
    display: flex;
    gap: 28px;
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  .fg-goal-card {
    background: #fff;
    box-shadow: 0 1px 10px 0 rgba(60,80,70,0.06), 0 1.5px 5px #f8f8f8;
    border-radius: 12px;
    padding: 24px 20px 16px 20px;
    min-width: 320px;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
    position: relative;
    transition: box-shadow .2s cubic-bezier(.77,0,.18,1);
  }
  .fg-goal-card:hover {
    box-shadow: 0 6px 30px 0 rgba(34,60,80,0.14), 0 1.5px 5px #f1f1f1;
  }
  .fg-goal-main {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .fg-goal-title {
    color: var(--primary-color);
    font-size: 1.18rem;
    font-weight: 700;
    flex: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    margin: 0;
  }
  .fg-goal-category {
    background: var(--accent-color);
    color: #fff;
    font-size: 0.92rem;
    font-weight: 400;
    border-radius: 6px;
    padding: 3px 9px;
    opacity: 0.86;
    margin-left: 2px;
    margin-right: 10px;
  }
  .fg-goal-editbtn, .fg-goal-deletebtn {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 1.18rem;
  }
  .fg-goal-editbtn:hover { color: var(--primary-color);}
  .fg-goal-deletebtn:hover { color: var(--secondary-color);}
  .fg-progress-row {
    margin: 12px 0 2px 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .fg-progress-label {
    font-size: 0.98rem;
    color: #999;
    flex-shrink: 0;
    font-weight: 500;
  }
  .fg-goal-dates {
    margin-bottom: 4px;
    font-size: 0.97rem;
    color: var(--secondary-color);
  }
  .fg-goal-deadline {
    color: var(--accent-color);
    font-weight: 600;
    margin-bottom: 4px;
    font-size: 0.96rem;
  }
  .fg-contribute-form {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 3px 0 2px 0;
  }
  .fg-contribute-input {
    padding: 8px 10px;
    border-radius: 6px;
    border: 1.5px solid #e0e5df;
    outline: none;
    font-size: 1rem;
    width: 56%;
    margin-right: 6px;
    background: #f5f6fa;
  }
  .fg-contribute-input:focus {
    border-color: var(--accent-color);
    background: #fff;
  }
  .fg-smart-suggestion {
    font-size: 0.94rem;
    color: #789262;
    font-style: italic;
    margin: 2px 0 0 2px;
  }
  .fg-progress-bar-outer {
    background: #eff4ee;
    width: 94px;
    border-radius: 8px;
    height: 13px;
    margin: 0 2px;
    overflow: hidden;
    border: 1.5px solid #e2eae0;
  }
  .fg-progress-bar-inner {
    height: 100%;
    background: var(--primary-color);
    border-radius: 8px 0 0 8px;
    transition: width 0.6s cubic-bezier(.77,0,.18,1);
  }
  .fg-reminders {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 8px;
    align-items: flex-end;
    min-height: 30px;
  }
  .fg-notification-card {
    background: var(--secondary-color);
    color: #222;
    border-radius: 8px;
    box-shadow: 0 2px 6px #ffa 22;
    padding: 8px 22px 8px 9px;
    font-size: 1.04rem;
    margin-top: 2px;
    animation: fadein-slide 0.7s;
    opacity: 0.94;
  }
  @keyframes fadein-slide {
    from {transform:translateX(20px);opacity:0;}
    to {transform:translateX(0); opacity:0.94;}
  }
  .fg-modal {
    position: fixed;top:0;left:0;right:0;bottom:0;z-index:2999;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .fg-modal-backdrop {
    position: absolute;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.13);
  }
  .fg-modal-content {
    position: relative;
    background: #fff;
    border-radius: 12px;
    padding: 32px 28px 28px 28px;
    box-shadow: 0 5px 40px 0 #98aeb830, 0 1.5px 5px #f1f1f1;
    z-index: 99999;
    width: 97vw;
    max-width: 370px;
    font-size: 1rem;
    animation:popup 0.19s;
  }
  @keyframes popup {from{transform:scale(0.91)}to{transform:scale(1)}}
  .fg-goal-form label {
    display: block; margin-bottom: 14px;font-size:1rem;color:#222;font-weight:500;
  }
  .fg-goal-form input[type="text"],
  .fg-goal-form input[type="number"],
  .fg-goal-form input[type="date"] {
    font-size: 1.01rem;
    border: 1.4px solid #e0e5df;
    padding: 7px 10px;
    border-radius: 5px;
    margin-top: 3px;
    width: 100%;
    background: #f6f9f8;
    margin-bottom: 2px;
  }
  .fg-goal-form input:focus {
    outline: none;
    border-color: var(--primary-color);
    background: #fff;
  }
  .fg-modal-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 3px;
  }
  .fg-empty-state {
    background: #eafbf1;
    color: #5aa05d;
    font-size: 1.11rem;
    border-radius: 9px;
    padding: 20px 24px;
    margin-bottom: 22px;
    border: 1.1px dashed var(--primary-color);
    opacity: 0.84;
    min-width: 230px;
  }
  ::selection { background: var(--accent-color); color: #fff; }
  `;
  document.head.appendChild(style);
};
injectFGStyles();

export default App;
