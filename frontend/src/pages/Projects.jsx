import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Users, ListTodo, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../api';

const Loader = () => (
  <div className="loading"><div className="dot-loader"><span/><span/><span/></div>Loading projects...</div>
);

function CreateProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await projectsAPI.create(form);
      toast.success('Project created!');
      onCreate(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">New Project</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-input" placeholder="e.g. Website Redesign" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="What is this project about?"
                value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    projectsAPI.list()
      .then(res => setProjects(res.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await projectsAPI.delete(id);
      setProjects(p => p.filter(x => x.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Projects</div>
          <div className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={14}/> New Project
        </button>
      </div>
      <div className="page-body">
        {projects.length === 0 ? (
          <div className="empty-state">
            <FolderKanban size={40}/>
            <h3>No projects yet</h3>
            <p>Create your first project to start managing tasks with your team</p>
            <button className="btn btn-primary" style={{marginTop:'16px'}} onClick={() => setShowCreate(true)}>
              <Plus size={14}/> Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(p => (
              <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px'}}>
                  <div className="project-card-name">{p.name}</div>
                  <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                    <span className={`badge badge-${p.user_role}`}>{p.user_role}</span>
                    {p.user_role === 'admin' && (
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={e => handleDelete(e, p.id)}
                        style={{color:'var(--red)', padding:'4px'}}>
                        <Trash2 size={13}/>
                      </button>
                    )}
                  </div>
                </div>
                <div className="project-card-desc">{p.description || 'No description'}</div>
                <div className="project-card-meta">
                  <span><Users size={11} style={{display:'inline', marginRight:'4px'}}/>{p.member_count} members</span>
                  <span><ListTodo size={11} style={{display:'inline', marginRight:'4px'}}/>{p.task_count} tasks</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={p => setProjects(prev => [p, ...prev])} />
      )}
    </div>
  );
}
