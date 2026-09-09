import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import { 
  Users, Search, Filter, Plus, Mail, Phone, Briefcase, 
  MoreVertical, Shield, AlertCircle, Edit, Trash2, Ban, 
  CheckCircle2, X, Check, Eye, Copy
} from 'lucide-react';

export default function StaffDirectoryPage() {
  const { user, workspace, isOwner, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [viewingStaff, setViewingStaff] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    roleTitle: '',
    department: 'Engineering',
    phone: '',
    password: 'Password123!',
    role: 'staff'
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await api.getStaff();
      setStaff(data);
    } catch (err) {
      addToast(err.message || 'Failed to fetch staff directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await api.addStaff(formData);
      addToast(`${formData.fullName} added successfully as ${formData.roleTitle}`, 'success');
      setIsAddModalOpen(false);
      setFormData({
        fullName: '',
        email: '',
        roleTitle: '',
        department: 'Engineering',
        phone: '',
        password: 'Password123!',
        role: 'staff'
      });
      fetchStaff();
    } catch (err) {
      addToast(err.message || 'Failed to add staff member', 'error');
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      await api.updateStaff(editingStaff.id, {
        fullName: editingStaff.fullName,
        roleTitle: editingStaff.roleTitle,
        department: editingStaff.department,
        phone: editingStaff.phone,
        status: editingStaff.status,
        role: editingStaff.role
      });
      addToast('Staff member updated successfully', 'success');
      setEditingStaff(null);
      fetchStaff();
    } catch (err) {
      addToast(err.message || 'Failed to update staff member', 'error');
    }
  };

  const handleToggleSuspend = async (staffMember) => {
    const newStatus = staffMember.status === 'suspended' ? 'active' : 'suspended';
    try {
      await api.updateStaff(staffMember.id, { status: newStatus });
      addToast(`Staff member marked as ${newStatus}`, 'success');
      fetchStaff();
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    }
  };

  const handleDeleteStaff = async (staffId, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the workspace?`)) return;
    try {
      await api.deleteStaff(staffId);
      addToast(`${name} was removed from workspace`, 'success');
      fetchStaff();
    } catch (err) {
      addToast(err.message || 'Failed to delete staff member', 'error');
    }
  };

  const departments = ['All', 'Engineering', 'Design', 'Product', 'Marketing', 'Operations', 'Human Resources', 'Sales'];

  const filteredStaff = staff.filter((s) => {
    const matchesSearch = 
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roleTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || s.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            Staff Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage company employees, job titles, department assignments, and access.
          </p>
        </div>

        {(isOwner || isAdmin) && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-indigo-500/30 text-xs">
              <span className="text-slate-400 font-medium">Staff Invite Code:</span>
              <span className="font-mono font-bold text-indigo-300 tracking-wider">
                {workspace?.invite_code || workspace?.inviteCode || 'VIGILANS-2026'}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(workspace?.invite_code || workspace?.inviteCode || 'VIGILANS-2026');
                  addToast('Staff invite code copied to clipboard!', 'success');
                }}
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                title="Copy Invite Code for Staff Sign Up"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, or role title (e.g. Product Designer)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedDept === dept
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Non-unique Roles Notice Note */}
      <div className="px-4 py-2.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs text-indigo-300">
        <span>💡 <strong>Role Flexibility:</strong> Multiple staff members can hold the identical role title (e.g. multiple Senior Engineers or Product Designers).</span>
        <span className="font-semibold text-white">{filteredStaff.length} employees found</span>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading team members...</div>
      ) : filteredStaff.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500">
          No staff members match the selected criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((person) => (
            <div
              key={person.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-sm transition flex flex-col justify-between ${
                person.status === 'suspended' ? 'border-rose-900/40 opacity-75' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={person.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100`}
                        alt={person.fullName}
                        className="w-12 h-12 rounded-full object-cover border border-slate-700"
                      />
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        person.status === 'suspended' ? 'bg-rose-500' :
                        person.isWorkingNow ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                        {person.fullName}
                        {person.role === 'owner' && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded font-bold uppercase">Owner</span>
                        )}
                        {person.role === 'admin' && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.2 rounded font-bold uppercase">Admin</span>
                        )}
                      </h3>
                      <p className="text-xs font-medium text-indigo-400 mt-0.5">{person.roleTitle}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    person.status === 'suspended'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : person.isWorkingNow
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {person.status === 'suspended' ? 'Suspended' : person.isWorkingNow ? 'Working' : 'Offline'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span>Department: <strong className="text-slate-200">{person.department || 'Operations'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{person.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{person.phone || 'No phone provided'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setViewingStaff(person)}
                  className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" /> View Profile
                </button>

                {(isOwner || isAdmin) && person.role !== 'owner' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingStaff(person)}
                      title="Edit Staff Member"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleSuspend(person)}
                      title={person.status === 'suspended' ? 'Reactivate Staff' : 'Suspend Staff'}
                      className={`p-1.5 rounded-lg transition ${
                        person.status === 'suspended'
                          ? 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900'
                          : 'bg-amber-950/60 text-amber-400 hover:bg-amber-900'
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteStaff(person.id, person.fullName)}
                        title="Remove from Workspace"
                        className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 hover:bg-rose-900 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-bold text-white">Add New Staff Member</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Samantha Wright"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="samantha@vigilans.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 012-7890"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.roleTitle}
                    onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                    placeholder="e.g. Product Designer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    {departments.filter(d => d !== 'All').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Access Level</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="staff">Staff (Standard)</option>
                    {isOwner && <option value="admin">Administrator</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg transition"
                >
                  Create Staff Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-bold text-white">Edit Staff Profile</h2>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStaff.fullName}
                  onChange={(e) => setEditingStaff({ ...editingStaff, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role Title</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.roleTitle}
                    onChange={(e) => setEditingStaff({ ...editingStaff, roleTitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                  <select
                    value={editingStaff.department}
                    onChange={(e) => setEditingStaff({ ...editingStaff, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    {departments.filter(d => d !== 'All').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingStaff.phone || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={editingStaff.status}
                    onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff View Profile Drawer/Modal */}
      {viewingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={viewingStaff.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100`}
                  alt={viewingStaff.fullName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500"
                />
                <div>
                  <h2 className="text-base font-bold text-white">{viewingStaff.fullName}</h2>
                  <p className="text-xs text-indigo-400 font-medium">{viewingStaff.roleTitle}</p>
                  <span className="text-[10px] text-slate-400">{viewingStaff.department}</span>
                </div>
              </div>
              <button onClick={() => setViewingStaff(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200 font-mono">{viewingStaff.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Phone:</span>
                <span className="text-slate-200">{viewingStaff.phone || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">System Role:</span>
                <span className="text-indigo-300 uppercase font-semibold">{viewingStaff.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Account Status:</span>
                <span className={`font-semibold capitalize ${viewingStaff.status === 'suspended' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {viewingStaff.status}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Current Presence:</span>
                <span className="text-slate-200">{viewingStaff.isWorkingNow ? 'Clocked In (Active)' : 'Clocked Out'}</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setViewingStaff(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
