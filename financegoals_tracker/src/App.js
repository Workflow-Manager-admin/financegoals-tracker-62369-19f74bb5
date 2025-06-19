import React, { useState, useEffect } from "react";
import "./App.css";

// Goal post SVG icon
const GoalPostIcon = () => (
  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" aria-label="goal post" style={{verticalAlign:'middle', marginRight: 4}}>
    <rect x="10" y="6" width="6" height="50" rx="3" fill="#7B61FF"/>
    <rect x="48" y="6" width="6" height="50" rx="3" fill="#7B61FF"/>
    <rect x="10" y="10" width="44" height="6" rx="3" fill="#4e36a1"/>
    <circle cx="32" cy="48" r="10" fill="url(#ball-gradient)"/>
    <defs>
      <radialGradient id="ball-gradient" cx="0.5" cy="0.5" r="0.6" fx="0.25" fy="0.25">
        <stop offset="0%" stopColor="#fff"/>
        <stop offset="35%" stopColor="#F3E6FF"/>
        <stop offset="100%" stopColor="#7B61FF"/>
      </radialGradient>
    </defs>
  </svg>
);

// PUBLIC_INTERFACE
function App() {
  // --- STATE MANAGEMENT ---
  const [goals, setGoals] = useState(() => {
    // Load from localStorage
    const stored = localStorage.getItem("goalie_goals");
    return stored ? JSON.parse(stored) : [];
  });
  const [reminders, setReminders] = useState([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Onboarding savings input modal:
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const done = localStorage.getItem("goalie_onboarding");
    return done ? false : true;
  });
  const [userSavingsPref, setUserSavingsPref] = useState(() => {
    const loaded = localStorage.getItem("goalie_user_pref");
    return loaded ? JSON.parse(loaded) : {
      savingMethod: "",
      monthlyIncome: "",
      monthlySpending: ""
    };
  });

  // Save goals to localStorage on change
  useEffect(() => {
    localStorage.setItem("goalie_goals", JSON.stringify(goals));
  }, [goals]);

  // Save userPref to localStorage
  useEffect(() => {
    if (userSavingsPref && userSavingsPref.savingMethod) {
      localStorage.setItem("goalie_user_pref", JSON.stringify(userSavingsPref));
    }
  }, [userSavingsPref]);

  // --- REMINDER SYSTEM (Micro-Habit) ---
  useEffect(() => {
    const habitTips = [
      "Tip: Even incremental savings count.",
      "Automate your next contribution!",
      "Visualize your progress—small steps matter.",
      "Finish strong—keep your goals on track.",
      "Your future self will thank you!"
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

  // PUBLIC_INTERFACE
  function handleOnboardingSubmit(pref) {
    setUserSavingsPref(pref);
    setShowOnboarding(false);
    localStorage.setItem("goalie_onboarding", "done");
    localStorage.setItem("goalie_user_pref", JSON.stringify(pref));
  }

  // Calculate user's suggested monthly, weekly, or daily saving
  function getSuggestedSavingsBreakdown() {
    const { monthlyIncome, monthlySpending, savingMethod } = userSavingsPref;
    if (!monthlyIncome || !monthlySpending || !savingMethod) return null;
    const income = Number(monthlyIncome);
    const spending = Number(monthlySpending);
    const savings = Math.max(0, income - spending);
    if (savings === 0) return { error: true };

    let breakdown, freqLabel;
    if (savingMethod === "monthly") {
      breakdown = savings;
      freqLabel = "month";
    } else if (savingMethod === "weekly") {
      breakdown = savings / 4.333; // average weeks in month
      freqLabel = "week";
    } else { // daily
      breakdown = savings / 30.44; // avg days in month
      freqLabel = "day";
    }

    return {
      breakdown: Math.floor(breakdown),
      freqLabel,
      totalSavings: savings,
    };
  }
  const suggestion = getSuggestedSavingsBreakdown();

  // --- RENDER ---
  return (
    <div className="app" style={{ background: "var(--gradient-bg)" }}>
      <nav className="navbar fg-navbar">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <div className="logo fg-logo" style={{color: "var(--primary-color)"}}>
              <GoalPostIcon />
              <span style={{letterSpacing:2,fontWeight:'bold',fontSize:'1.35rem'}}>Goalie</span>
            </div>
            <button className="btn" style={{
              background: "var(--accent-color)"
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
          <div className="hero" style={{paddingTop: 104, paddingBottom: 24}}>
            <div className="subtitle" style={{color:"var(--primary-color)", fontWeight:700}}>
              Plan. Save. Score Your Goals.
            </div>
            <h1 className="title" style={{
              fontSize: "2.5rem",
              color: "var(--darker)",
              margin: 0,
              fontWeight: 700,
              letterSpacing:1
            }}>
              Welcome to Goalie!
            </h1>
            <div className="description" style={{ color: "var(--text-secondary)", maxWidth: 480 }}>
              Set, manage and track your real-life financial goals.<br />
              Create savings plans, watch your progress, and adopt winning money habits.
            </div>
            {/* Dynamic Savings Suggestion */}
            {userSavingsPref && userSavingsPref.savingMethod && suggestion && !suggestion.error && (
              <div className="goalie-savings-plan-card">
                <div className="gs-plan-header">
                  <span style={{fontWeight:600, fontSize:"1.13rem"}}>
                    {userSavingsPref.savingMethod.charAt(0).toUpperCase()+userSavingsPref.savingMethod.slice(1)} savings plan:
                  </span>
                </div>
                <div className="gs-plan-body">
                  <span>
                    You should aim to save <span style={{color:"var(--accent-color)", fontWeight:700}}>{formatMoney(suggestion.breakdown)}</span> per {suggestion.freqLabel} <br />
                    (Based on your monthly income of <b>{formatMoney(userSavingsPref.monthlyIncome)}</b> and spending <b>{formatMoney(userSavingsPref.monthlySpending)}</b>)
                  </span>
                  <div className="gs-plan-detail">
                    <em>Total saveable per month: <b>{formatMoney(suggestion.totalSavings)}</b></em>
                  </div>
                </div>
                <button className="btn btn-switch-plan" onClick={() => setShowOnboarding(true)}>
                  Adjust Plan
                </button>
              </div>
            )}
            {suggestion && suggestion.error && (
              <div className="goalie-savings-plan-card error">
                <span>
                  Your spending matches your income. Consider changing values!
                </span>
                <button className="btn btn-switch-plan" onClick={() => setShowOnboarding(true)}>
                  Adjust Plan
                </button>
              </div>
            )}
          </div>

          {/* Goal Cards */}
          <div className="fg-goal-list">
            {goals.length === 0 && (
              <div className="fg-empty-state goalie-card-glow">
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

      {/* Onboarding/Settings Modal */}
      {showOnboarding && (
        <SavingsPrefModal
          defaultValues={userSavingsPref}
          onSubmit={handleOnboardingSubmit}
          onClose={() => showOnboarding ? setShowOnboarding(false) : null}
        />
      )}
    </div>
  );
}

// --- Notification Card ---
function NotificationCard({ message }) {
  return (
    <div className="fg-notification-card goalie-card-glow">
      <span role="img" aria-label="reminder">⏰</span> {message}
    </div>
  );
}

// --- Goal Card Component ---
// PUBLIC_INTERFACE
function GoalCard({ goal, onEdit, onDelete, onContribute }) {
  const [smartAmount, setSmartAmount] = useState(() =>
    smartSuggestedContribution(goal)
  );
  const [inputAmt, setInputAmt] = useState("");

  useEffect(() => {
    setSmartAmount(smartSuggestedContribution(goal));
  }, [goal]);

  const progress = Math.min(
    (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100,
    100
  );

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
    <div className="fg-goal-card goalie-card-glow">
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
      <div className="fg-smart-suggestion" style={{color:"var(--accent-color)"}}>
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

// --- Savings Preference Modal ---
function SavingsPrefModal({ defaultValues, onSubmit, onClose }) {
  const [fields, setFields] = useState({
    savingMethod: defaultValues?.savingMethod || "",
    monthlyIncome: defaultValues?.monthlyIncome || "",
    monthlySpending: defaultValues?.monthlySpending || ""
  });
  const [showError, setShowError] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFields(f => ({
      ...f,
      [name]: value
    }));
    setShowError(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!fields.savingMethod || !fields.monthlyIncome || !fields.monthlySpending ||
        Number(fields.monthlyIncome) <= 0 || Number(fields.monthlySpending) < 0
    ) {
      setShowError(true);
      return;
    }
    onSubmit(fields);
  }

  return (
    <div className="fg-modal">
      <div className="fg-modal-content goalie-modal-modern">
        <h2 style={{marginBottom:"0.6em", textAlign:'center'}}>
          Choose Your Savings Plan
        </h2>
        <form onSubmit={handleSubmit} className="fg-goal-form goalie-onboard-form">
          <label>
            Saving Frequency *
            <select
              name="savingMethod"
              required
              value={fields.savingMethod}
              onChange={handleChange}
              style={{marginTop: "5px"}}
            >
              <option value="" disabled>Select...</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label>
            Monthly Income (₹) *
            <input
              type="number"
              name="monthlyIncome"
              required
              min="0"
              value={fields.monthlyIncome}
              onChange={handleChange}
            />
          </label>
          <label>
            Monthly Spending (₹) *
            <input
              type="number"
              name="monthlySpending"
              required
              min="0"
              value={fields.monthlySpending}
              onChange={handleChange}
            />
          </label>
          {showError && (
            <div className="goalie-error-msg">
              Please fill all values (income > 0, spending ≥ 0, and choose saving frequency)!
            </div>
          )}
          <div className="fg-modal-actions" style={{justifyContent:"center",marginTop:12}}>
            <button type="submit" className="btn" style={{background: "var(--primary-color)"}}>Save & Continue</button>
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
  if (!goal || !goal.targetAmount || !goal.deadline) return 0;
  const now = new Date();
  const deadline = new Date(goal.deadline);
  const daysLeft = Math.max(1, Math.ceil((+deadline - +now) / (1000 * 60 * 60 * 24)));
  const amountLeft = Math.max(0, Number(goal.targetAmount) - Number(goal.currentAmount));
  return Math.ceil(amountLeft / daysLeft);
}
function formatMoney(amount) {
  return "₹" + Number(amount).toLocaleString();
}

// --- NEW COLOR PALETTE (No Green) ---
const setRootPalette = () => {
  const root = document.documentElement;
  // Modern purple/blue palette for Goalie
  root.style.setProperty("--primary-color", "#7B61FF");
  root.style.setProperty("--secondary-color", "#F4D35E");
  root.style.setProperty("--accent-color", "#4e8cff");
  root.style.setProperty("--base-light", "#F3E6FF");
  root.style.setProperty("--base-dark", "#22223B");
  root.style.setProperty("--gradient-bg", "linear-gradient(100deg, #FAFAFB 0%, #EAF6FF 52%, #F3E6FF 100%)");
  root.style.setProperty("--darker", "#22223b");
  root.style.setProperty("--text-color", "#22223b");
  root.style.setProperty("--text-secondary", "#7B88A1");
  root.style.setProperty("--border-color", "#ece1ff");
};
setRootPalette();

// --- STYLES ---
// Card, progress, modal and UI element styles
const injectGoalieCardStyles = () => {
  if (document.getElementById("goalie-styles")) return;
  const style = document.createElement("style");
  style.id = "goalie-styles";
  style.innerHTML = `
    .goalie-card-glow {
      box-shadow: 0 6px 28px 0 #d8d6fc40, 0 2px 6px #e6ebf680, 0 1.5px 5px #f1f1f1;
      border-radius: 13px;
      transition: box-shadow .23s;
    }
    .goalie-card-glow:hover, .goalie-card-glow:focus {
      box-shadow: 0 12px 48px 0 #827bdd66, 0 2px 6px #e6ebf680, 0 3px 11px #e5e9f4b0;
    }
    .goalie-savings-plan-card {
      background: var(--base-light);
      color: var(--darker);
      border-radius: 14px;
      padding: 18px 18px 12px 18px;
      margin-bottom: 14px;
      box-shadow: 0 1.5px 10px #ccc1 0 2px 13px #a089fc20;
      border: 1.5px solid var(--border-color);
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 3px;
      align-items: flex-start;
      min-width:230px;
      max-width:360px;
      margin-left:auto;
      margin-right:auto;
      animation: popup 0.2s;
    }
    .goalie-savings-plan-card .gs-plan-header {
      font-size: 1.13rem;
      font-weight:bold;
      margin-bottom: 4px;
    }
    .goalie-savings-plan-card .gs-plan-body {
      font-size: 1.07rem;
      margin-bottom: 6px;
    }
    .goalie-savings-plan-card .gs-plan-detail {
      font-size:0.98rem;
      color:var(--text-secondary);
      margin-top:2px;
    }
    .goalie-savings-plan-card .btn-switch-plan {
      margin-top: 8px;
      font-size: 0.99rem;
      background: var(--primary-color);
      color: #fff;
    }
    .goalie-savings-plan-card.error {
      color: #bb222c;
      background: #fff2f2;
      border-color: #fae7e7;
    }
    .goalie-modal-modern {
      background: linear-gradient(111deg,#fafffe 0%,#f2eafe 100%);
      box-shadow: 0 8px 42px 0 #5147811d, 0 1.5px 7px #dbc8f470;
      border: 2px solid #e7dcff !important;
      border-radius: 16px !important;
    }
    .goalie-onboard-form label {
      color: var(--primary-color);
      font-weight:600;
    }
    .goalie-error-msg {
      color: #bb222c;
      background: #fff2f2;
      border-radius:6px;
      padding: 7px 9px;
      font-size: 0.96rem;
      margin-bottom: 6px;
    }
    .goalie-onboard-form select {
      font-size:1.01rem;
      border: 1.3px solid #e0e5df;
      padding: 7.5px 10px;
      border-radius: 5px;
      margin-bottom: 2px;
      background: #f6f9f8;
      width: 100%;
      color: var(--darker);
    }
    .goalie-onboard-form select:focus {
      border-color: var(--primary-color);
      background: #fff;
      outline: none;
    }
  `;
  document.head.appendChild(style);
};
injectGoalieCardStyles();

export default App;
