import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, CheckCircle2, Clock, AlertTriangle, Users, ArrowRight } from 'lucide-react';
import { dashboardAPI } from '../api';
import { useAuth } from '../AuthContext';
import { format, parseISO } from 'date-fns';

const Loader = () => (
  <div className="loading">
    <div className="dot-loader"><span/><span/><span/></div>
    Loading dashboard...
  </div>
);

const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const priorityLabel = { low: 'Low', medium: 'Medium', high: 'High' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAPI.get()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const todoCount = data?.tasksByStatus?.todo || 0;
  const inProgressCount = data?.tasksByStatus?.in_progress || 0;
  const doneCount = data?.tasksByStatus?.done || 0;

  const statCards = [
    {
      color: 'purple',
      icon: <LayoutDashboard size={20}/>,
      value: data?.projectCount || 0,
      label: 'Projects',
      to: '/projects',
    },
    {
      color: 'blue',
      icon: <ListTodo size={20}/>,
      value: data?.totalTasks || 0,
      label: 'Total Tasks',
      to: '/tasks',
    },
    {
      color: 'yellow',
      icon: <Clock size={20}/>,
      value: inProgressCount,
      label: 'In Progress',
      to: '/tasks?status=in_progress',
    },
    {
      color: 'green',
      icon: <CheckCircle2 size={20}/>,
      value: doneCount,
      label: 'Completed',
      to: '/tasks?status=done',
    },
    {
      color: 'red',
      icon: <AlertTriangle size={20}/>,
      value: data?.overdueTasks || 0,
      label: 'Overdue',
      to: '/tasks?filter=overdue',
    },
    {
      color: 'blue',
      icon: <Users size={20}/>,
      value: data?.myTasks || 0,
      label: 'My Tasks',
      to: '/tasks?filter=mine',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Welcome back, {user?.name}</div>
        </div>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          {statCards.map((card) => (
            <Link
              key={card.label}
              to={card.to}
              className={`stat-card ${card.color}`}
              style={{
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
                display: 'block',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.opacity = '1';
              }}
            >
              <div className="stat-icon">{card.icon}</div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </Link>
          ))}
        </div>

        <div className="two-col">
          {/* Recent Tasks */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Tasks</span>
              <Link to="/projects" style={{fontSize:'12px', color:'var(--accent2)', textDecoration:'none', display:'flex', alignItems:'center', gap:'4px'}}>
                All projects <ArrowRight size={12}/>
              </Link>
            </div>
            {data?.recentTasks?.length === 0 ? (
              <div className="empty-state">
                <ListTodo size={32}/>
                <h3>No tasks yet</h3>
                <p>Create a project and add tasks to get started</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentTasks?.map(task => (
                      <tr key={task.id}>
                        <td>
                          <div style={{fontWeight:600}}>{task.title}</div>
                          {task.due_date && (
                            <div className="text-xs text-muted" style={{marginTop:'2px'}}>
                              Due {format(parseISO(task.due_date), 'MMM d')}
                            </div>
                          )}
                        </td>
                        <td className="text-xs text-muted">{task.project_name}</td>
                        <td><span className={`badge badge-${task.status}`}>{statusLabel[task.status]}</span></td>
                        <td><span className={`badge badge-${task.priority}`}>{priorityLabel[task.priority]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Task breakdown */}
          <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            <div className="card">
              <div className="card-header"><span className="card-title">Status Breakdown</span></div>
              <div className="card-body">
                {[
                  { key: 'todo', label: 'To Do', count: todoCount, color: 'var(--text3)', to: '/tasks?status=todo' },
                  { key: 'in_progress', label: 'In Progress', count: inProgressCount, color: 'var(--blue)', to: '/tasks?status=in_progress' },
                  { key: 'done', label: 'Done', count: doneCount, color: 'var(--green)', to: '/tasks?status=done' },
                ].map(({ key, label, count, color, to }) => {
                  const total = data?.totalTasks || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <Link
                      key={key}
                      to={to}
                      style={{ textDecoration: 'none', display: 'block', marginBottom: '12px', cursor: 'pointer' }}
                    >
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px', fontSize:'12px'}}>
                        <span style={{color:'var(--text2)', fontWeight:500}}>{label}</span>
                        <span style={{color, fontFamily:'DM Mono, monospace'}}>{count}</span>
                      </div>
                      <div style={{height:'4px', background:'var(--surface3)', borderRadius:'4px', overflow:'hidden'}}>
                        <div style={{width:`${pct}%`, height:'100%', background:color, borderRadius:'4px', transition:'width 0.4s ease'}}/>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {data?.tasksByUser?.length > 0 && (
              <div className="card">
                <div className="card-header"><span className="card-title">Tasks by Member</span></div>
                <div className="card-body" style={{padding:'12px 16px'}}>
                  {data.tasksByUser.map(u => (
                    <div key={u.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <div className="user-avatar" style={{width:'22px', height:'22px', fontSize:'9px'}}>{u.name?.charAt(0).toUpperCase()}</div>
                        <span style={{fontSize:'13px'}}>{u.name}</span>
                      </div>
                      <span style={{fontSize:'12px', fontFamily:'DM Mono, monospace', color:'var(--accent2)'}}>{u.task_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}