import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Plus, Trash2, Calendar, Flag, User, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../api';
import { useToast } from '../../context/ToastContext';

export const CreateTaskModal = ({ isOpen, onClose, onTaskCreated, staffMembers }) => {
  const { success, error, addToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [subtasks, setSubtasks] = useState(['']);
  const [staffList, setStaffList] = useState(staffMembers || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (staffMembers && staffMembers.length > 0) {
        setStaffList(staffMembers);
      } else {
        apiRequest('/staff')
          .then(res => setStaffList(res || []))
          .catch(() => {});
      }
    }
  }, [isOpen, staffMembers]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    setSubtasks(prev => [...prev, '']);
  };

  const handleSubtaskChange = (index, value) => {
    setSubtasks(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAssignee = (userId) => {
    setSelectedAssignees(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      if (error) error('Please enter a task title.');
      else addToast('Please enter a task title.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const filteredSubtasks = subtasks.filter(s => s.trim().length > 0);
      const res = await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
          due_date: dueDate || null,
          assignees: selectedAssignees,
          subtasks: filteredSubtasks,
        }),
      });

      if (success) success('Task created successfully!');
      else addToast('Task created successfully!', 'success');
      
      if (onTaskCreated) onTaskCreated(res);
      onClose();
      // reset
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setSelectedAssignees([]);
      setSubtasks(['']);
    } catch (err) {
      if (error) error(err.message || 'Failed to create task');
      else addToast(err.message || 'Failed to create task', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <CheckSquare size={20} />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">Create New Workspace Task</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Design Mobile Attendance Barcode Standee"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Description & Context
            </label>
            <textarea
              rows={3}
              placeholder="Detailed instructions, deliverables, and acceptance criteria..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Flag size={14} />
                <span>Priority</span>
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar size={14} />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Assignees Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <User size={14} />
              <span>Assign Staff ({selectedAssignees.length} selected)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              {staffList.map(s => {
                const isSelected = selectedAssignees.includes(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleAssignee(s.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <img src={s.profile_picture || s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} alt="" className="w-4 h-4 rounded-full object-cover" />
                    <span>{s.first_name ? `${s.first_name} ${s.last_name}` : (s.fullName || s.name)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Subtasks / Checklist
              </label>
              <button
                type="button"
                onClick={handleAddSubtask}
                className="text-[11px] font-semibold text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Add Item</span>
              </button>
            </div>
            <div className="space-y-1.5">
              {subtasks.map((st, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Subtask #${idx + 1}`}
                    value={st}
                    onChange={e => handleSubtaskChange(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                  {subtasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-transform hover:scale-105 shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Task...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
