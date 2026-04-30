import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X, Trash2, UserPlus, ChevronLeft, Edit2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO, isPast } from 'date-fns';
import { projectsAPI, tasksAPI } from '../api';
import { useAuth } from '../AuthContext';

const Loader = () => (
  <div className="loading"><div className="dot-loader"><span/><span/><span/></div>Loading project...</div>
);

const STATUS_OPTIONS = ['todo', 'in_progress', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

function TaskModal({ task, projectId, members, onClose, onSave, isAdmin }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assigned_to: task?.assigned_to || '',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, assigned_to: form.assigned_to || null };
      let res;
      if (task) {
        res = await tasksAPI.update(projectId, task.id, payload);
      } else {
        res = await tasksAPI.create(projectId, payload);
      }
      onSave(res.data, !!task);
      toast.success(task ? 'Task updated!' : 'Task created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{task ? 'Edit Task' : 'New Task'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Task title" disabled={!isAdmin} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the task..." disabled={!isAdmin} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} disabled={!isAdmin}>
                  {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-select" value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} disabled={!isAdmin}>
                  <option value="">Unassigned</option>
                  {members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} disabled={!isAdmin} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdd }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await projectsAPI.addMember(projectId, { email, role });
      onAdd(res.data.user, role);
      toast.success('Member added!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:'380px'}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Add Member</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="member@company.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
              <div style={{fontSize:'11px', color:'var(--text3)', marginTop:'4px', fontFamily:'DM Mono, monospace'}}>User must already have an account</div>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={loading}><UserPlus size={14}/> {loading ? 'Adding...' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskModal, setTaskModal] = useState(null); // null | 'create' | task obj
  const [showAddMember, setShowAddMember] = useState(false);
  const [filter, setFilter] = useState('all');

  const isAdmin = project?.user_role === 'admin';

  useEffect(() => {
    Promise.all([projectsAPI.get(id), tasksAPI.list(id)])
      .then(([pRes, tRes]) => {
        setProject(pRes.data);
        setTasks(tRes.data);
      })
      .catch(() => { toast.error('Failed to load project'); navigate('/projects'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleTaskSave = (savedTask, isEdit) => {
    if (isEdit) {
      setTasks(t => t.map(x => x.id === savedTask.id ? savedTask : x));
    } else {
      setTasks(t => [savedTask, ...t]);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(id, taskId);
      setTasks(t => t.filter(x => x.id !== taskId));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await projectsAPI.removeMember(id, userId);
      setProject(p => ({...p, members: p.members.filter(m => m.id !== userId)}));
      toast.success('Member removed');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'mine') return t.assigned_to === user.id;
    if (filter === 'overdue') return t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'done';
    return t.status === filter;
  });

  if (loading) return <Loader />;
  if (!project) return null;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm" style={{marginBottom:'4px', padding:'4px 8px'}} onClick={() => navigate('/projects')}>
            <ChevronLeft size={14}/> Projects
          </button>
          <div className="page-title">{project.name}</div>
          <div className="page-subtitle">{project.description || 'No description'}</div>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setTaskModal('create')}>
              <Plus size={14}/> New Task
            </button>
          )}
        </div>
      </div>
      <div className="page-body">
        <div className="tabs">
          <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            Tasks ({tasks.length})
          </button>
          <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
            Members ({project.members?.length || 0})
          </button>
        </div>

        {activeTab === 'tasks' && (
          <>
            {/* Filters */}
            <div className="flex gap-2 mb-4" style={{flexWrap:'wrap'}}>
              {[
                {key:'all', label:'All'},
                {key:'mine', label:'Assigned to me'},
                {key:'todo', label:'To Do'},
                {key:'in_progress', label:'In Progress'},
                {key:'done', label:'Done'},
                {key:'overdue', label:'Overdue'},
              ].map(f => (
                <button key={f.key}
                  className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilter(f.key)}>{f.label}</button>
              ))}
            </div>

            <div className="card">
              {filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <Plus size={32}/>
                  <h3>No tasks found</h3>
                  <p>{filter === 'all' && isAdmin ? 'Create your first task to get started' : 'No tasks match this filter'}</p>
                  {filter === 'all' && isAdmin && (
                    <button className="btn btn-primary" style={{marginTop:'16px'}} onClick={() => setTaskModal('create')}>
                      <Plus size={14}/> Create Task
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Assigned</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Due Date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map(task => {
                        const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done';
                        const canEdit = isAdmin || task.assigned_to === user.id;
                        return (
                          <tr key={task.id}>
                            <td>
                              <div style={{fontWeight:600}}>{task.title}</div>
                              {task.description && (
                                <div className="text-xs text-muted" style={{marginTop:'2px', maxWidth:'300px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{task.description}</div>
                              )}
                            </td>
                            <td className="text-sm">{task.assigned_to_name || <span className="text-muted">Unassigned</span>}</td>
                            <td><span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span></td>
                            <td><span className={`badge badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span></td>
                            <td>
                              {task.due_date ? (
                                <span className={`text-xs ${isOverdue ? 'text-red' : 'text-muted'}`}>
                                  {isOverdue ? '⚠ ' : ''}{format(parseISO(task.due_date), 'MMM d, yyyy')}
                                </span>
                              ) : <span className="text-xs text-muted">—</span>}
                            </td>
                            <td>
                              <div className="flex gap-2">
                                {canEdit && (
                                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setTaskModal(task)}>
                                    <Edit2 size={13}/>
                                  </button>
                                )}
                                {isAdmin && (
                                  <button className="btn btn-ghost btn-icon btn-sm" style={{color:'var(--red)'}} onClick={() => handleDeleteTask(task.id)}>
                                    <Trash2 size={13}/>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'members' && (
          <div className="card" style={{maxWidth:'600px'}}>
            <div className="card-header">
              <span className="card-title">Team Members</span>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>
                  <UserPlus size={13}/> Add Member
                </button>
              )}
            </div>
            <div>
              {project.members?.map(m => (
                <div key={m.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid var(--border)'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                    <div className="user-avatar">{m.name?.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{fontWeight:600, fontSize:'13px'}}>{m.name} {m.id === user.id && <span style={{color:'var(--text3)', fontSize:'11px'}}>(you)</span>}</div>
                      <div className="text-xs text-muted">{m.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${m.role}`}>{m.role}</span>
                    {isAdmin && m.id !== user.id && (
                      <button className="btn btn-ghost btn-icon btn-sm" style={{color:'var(--red)'}} onClick={() => handleRemoveMember(m.id)}>
                        <Trash2 size={13}/>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {taskModal && (
        <TaskModal
          task={taskModal === 'create' ? null : taskModal}
          projectId={id}
          members={project.members}
          onClose={() => setTaskModal(null)}
          onSave={handleTaskSave}
          isAdmin={isAdmin}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowAddMember(false)}
          onAdd={(newUser, role) => setProject(p => ({...p, members: [...p.members, {...newUser, role}]}))}
        />
      )}
    </div>
  );
}
