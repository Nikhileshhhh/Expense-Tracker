import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBillReminders } from '../../contexts/BillReminderContext';
import { AlertCircle, CheckCircle } from 'lucide-react';


const predefinedIndianBills = [
  'Electricity Bill',
  'Water Bill',
  'Internet',
  'Mobile Recharge',
  'House Tax / Land Tax',
  'Health Insurance Premium',
  'School/College Fees',
  'EMI Payments',
  'Gas Cylinder Booking'
];

const UpcomingBills: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { reminders, addReminder, deleteReminder, markAsPaid } = useBillReminders();

  const [billForm, setBillForm] = useState({
    billName: '',
    dueDate: '',
    reminderTime: '1-day-before',
    notes: ''
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) {
      alert('Please wait while we load your account information.');
      return;
    }

    if (!user || !user.uid) {
      alert('You must be logged in to set a bill reminder. Please refresh the page and try again.');
      return;
    }

    if (!billForm.billName || !billForm.dueDate) {
      alert('Please select a bill and due date.');
      return;
    }

    if (billForm.dueDate < todayStr) {
      alert('Please select a valid due date (today or future).');
      return;
    }

    addReminder({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: user.uid,
      billName: billForm.billName,
      dueDate: billForm.dueDate,
      reminderTime: billForm.reminderTime as 'same-day' | '1-day-before' | '3-days-before',
      notes: billForm.notes,
      isPaid: false,
      createdAt: new Date().toISOString()
    });

    setBillForm({ billName: '', dueDate: '', reminderTime: '1-day-before', notes: '' });
    alert('Reminder added!');
  };

  return (
    <div className="space-y-6">
      {/* Add New Reminder Form */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h2 className="text-white text-xl font-semibold mb-4">Add a New Bill Reminder</h2>
        
        {isLoading && (
          <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3 mb-4">
            <p className="text-yellow-300 text-sm">Loading your account information...</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Bill Name *</label>
            <select
              value={billForm.billName}
              onChange={(e) => setBillForm({ ...billForm, billName: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              required
            >
              <option value="">Select a bill</option>
              {predefinedIndianBills.map((bill) => (
                <option key={bill} value={bill}>{bill}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Due Date *</label>
            <input
              type="date"
              value={billForm.dueDate}
              onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              required
              min={todayStr}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Reminder Time</label>
            <select
              value={billForm.reminderTime}
              onChange={(e) => setBillForm({ ...billForm, reminderTime: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="same-day">Same Day</option>
              <option value="1-day-before">1 Day Before</option>
              <option value="3-days-before">3 Days Before</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Notes</label>
            <input
              type="text"
              value={billForm.notes}
              onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="Optional note"
            />
          </div>

          <div className="md:col-span-2 flex justify-end space-x-4 mt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Add Reminder'}
            </button>
          </div>
        </form>
      </div>

      {/* Reminder List */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h2 className="text-white text-xl font-semibold mb-4">Upcoming Bill Reminders</h2>
        {reminders.length === 0 ? (
          <p className="text-gray-400">No reminders added yet.</p>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-4 border rounded-lg flex justify-between items-center ${
                  reminder.isPaid ? 'bg-green-900 border-green-700' : 'bg-gray-700 border-gray-600'
                }`}
              >
                <div>
                  <h3 className="text-white font-medium">{reminder.billName}</h3>
                  <p className="text-gray-400 text-sm">
                    Due: {reminder.dueDate} • Reminder: {reminder.reminderTime.replace(/-/g, ' ')}
                  </p>
                  {reminder.notes && <p className="text-gray-500 text-xs italic">{reminder.notes}</p>}
                </div>
                <div className="flex space-x-2">
                  {!reminder.isPaid && (
                    <button
                      onClick={() => markAsPaid(reminder.id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-lg"
                    >
                      Mark as Paid
                    </button>
                  )}
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingBills;
