import React, { useState } from "react";

/**
 * PUBLIC_INTERFACE
 * Modal form to add a Google Calendar event for a specific goal.
 * @param {Object} props
 * @param {Array} props.goals - User's goals [{ id, name, ... }, ...]
 * @param {Function} props.onSubmit - Form submit handler({goalId, date, amount, description})
 * @param {Function} props.onClose - Modal close handler
 */
export default function AddReminderModal({ goals, onSubmit, onClose }) {
  const [goalId, setGoalId] = useState(goals.length > 0 ? goals[0].id : "");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!goalId || !date || !amount) return;
    onSubmit({ goalId, date, amount, description });
  }

  return (
    <div className="fg-modal">
      <div className="fg-modal-content">
        <h2>Add Google Calendar Reminder</h2>
        <form className="fg-goal-form" onSubmit={handleSubmit}>
          <label>
            Goal *
            <select
              value={goalId}
              onChange={e => setGoalId(e.target.value)}
              required
            >
              {goals.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date for Reminder *
            <input
              type="date"
              value={date}
              required
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setDate(e.target.value)}
            />
          </label>
          <label>
            Amount (₹) *
            <input
              type="number"
              min="1"
              value={amount}
              required
              onChange={e => setAmount(e.target.value)}
            />
          </label>
          <label>
            Notes
            <input
              type="text"
              value={description}
              maxLength={60}
              placeholder="Optional notes…"
              onChange={e => setDescription(e.target.value)}
            />
          </label>
          <div className="fg-modal-actions">
            <button className="btn" style={{ background: "var(--primary-color)" }}>
              Add
            </button>
            <button
              type="button"
              className="btn"
              style={{ background: "#bbb", color: "#333" }}
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      <div className="fg-modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
