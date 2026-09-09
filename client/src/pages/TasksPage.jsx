import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import { 
  CheckSquare, Plus, LayoutGrid, List, Calendar, CheckCircle2, 
  Clock, AlertCircle, MessageSquare, ChevronRight, User, X, Check,
  Send, MoreHorizontal, ArrowRight
} from 'lucide-react';

export default function TasksPage() {
  const { user, isOwner, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newComment, setNewComment] = useState('');

  const fetchTasksData = async () => {
    try {
      setLoading(true);
      const [tData, sData] = await Promise.all([
        api.getTasks(),
        api.getStaff()
      ]);
      setTasks(tData || []);
      setStaffList(sData || []);
    } catch (err) {
      addToast('Failed to load workspace tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      addToast(`Task moved to ${newStatus.replace('-', ' ')}`, 'success');
      // Update local state
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      addToast(err.message || 'Failed to update task status', 'error');
    }
  };

  const handleToggleSubtask = async (taskId, subtaskId, currentCompleted) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const updatedSubtasks = (task.subtasks || []).map(s => 
        s.id === subtaskId ? { ...s, completed: !currentCompleted } : s
      );
      await api.updateTask(taskId, { subtasks: updatedSubtasks });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t));
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => ({ ...prev, subtasks: updatedSubtasks }));
      }
    } catch (err) {
      addToast('Failed to update subtask', 'error');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    try {
      const updated = await api.addTaskComment(selectedTask.id, { content: newComment });
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? updated : t));
      setSelectedTask(updated);
      setNewComment('');
      addToast('Comment added', 'success');
    } catch (err) {
      addToast('Failed to add comment', 'error');
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do', color: 'border-slate-700' },
    { id: 'in-progress', title: 'In Progress', color: 'border-indigo-500' },
    { id: 'review', title: 'Review & QA', color: 'border-amber-500' },
    { id: 'completed', title: 'Completed', color: 'border-emerald-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-indigo-400" />
            Workspace Tasks
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dual Kanban board & list view for task tracking, priorities, subtasks, and comments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading task board...</div>
      ) : viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 flex flex-col min-h-[220px] md:min-h-[600px]">
                <div className={`flex items-center justify-between pb-3 border-b ${col.color}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {col.title}
                  </h3>
                  <span className="text-xs font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                <div className="mt-3 space-y-3 flex-1 overflow-y-auto pr-1">
                  {colTasks.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-600 border border-dashed border-slate-800/80 rounded-xl">
                      Empty
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="p-4 bg-slate-950 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl cursor-pointer transition shadow-sm group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
                            task.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                            task.priority === 'medium' ? 'bg-indigo-500/20 text-indigo-400' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {task.dueDate ? `Due ${task.dueDate}` : 'No date'}
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-indigo-300 transition">
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>

                        {/* Subtasks Progress Bar */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                              <span>Checklist</span>
                              <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-500 h-full transition-all"
                                style={{
                                  width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                          {/* Assignee */}
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                              {task.assigneeName ? task.assigneeName.charAt(0) : 'U'}
                            </div>
                            <span className="text-[11px] text-slate-400 truncate max-w-[90px]">
                              {task.assigneeName || 'Unassigned'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            {task.comments && task.comments.length > 0 && (
                              <span className="flex items-center gap-0.5">
                                <MessageSquare className="w-3 h-3" /> {task.comments.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Task Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="font-semibold text-white hover:text-indigo-400 text-left transition"
                    >
                      {task.title}
                    </button>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{task.description}</p>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-indigo-300 focus:outline-none"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
                      task.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-medium">
                    {task.assigneeName || 'Unassigned'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {task.dueDate || '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateOpen && (
        <CreateTaskModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onTaskCreated={() => {
            fetchTasksData();
            setIsCreateOpen(false);
          }}
          staffMembers={staffList}
        />
      )}

      {/* Task Details Drawer/Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    selectedTask.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
                    selectedTask.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {selectedTask.priority}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Due: {selectedTask.dueDate || 'Ongoing'}</span>
                </div>
                <h2 className="text-lg font-bold text-white">{selectedTask.title}</h2>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <p className="text-sm text-slate-200 whitespace-pre-wrap bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {selectedTask.description || 'No description provided.'}
                </p>
              </div>

              {/* Status and Assignee bar */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Current Status
                  </label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleUpdateStatus(selectedTask.id, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review & QA</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Assignee
                  </label>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>{selectedTask.assigneeName || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              {/* Subtasks checklist */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Subtasks Checklist ({selectedTask.subtasks?.filter(s => s.completed).length || 0}/{selectedTask.subtasks?.length || 0})
                </label>
                <div className="space-y-2">
                  {(selectedTask.subtasks || []).map(s => (
                    <div
                      key={s.id}
                      onClick={() => handleToggleSubtask(selectedTask.id, s.id, s.completed)}
                      className="flex items-center gap-3 p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        s.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-600'
                      }`}>
                        {s.completed && <Check className="w-3 h-3" />}
                      </div>
                      <span className={`text-xs ${s.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {s.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Task Discussion ({selectedTask.comments?.length || 0})
                </label>
                <div className="space-y-3 mb-3">
                  {(selectedTask.comments || []).map(c => (
                    <div key={c.id} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-semibold text-indigo-300">{c.authorName}</span>
                        <span className="text-[10px]">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-200">{c.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment or status update..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Reply
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
