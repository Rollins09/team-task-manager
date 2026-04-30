const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
router.use(authenticate);

// Helper: check project membership
const getProjectRole = async (projectId, userId) => {
  const result = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return result.rows.length > 0 ? result.rows[0].role : null;
};

// GET /api/projects/:projectId/tasks
router.get('/', async (req, res) => {
  const role = await getProjectRole(req.params.projectId, req.user.id);
  if (!role) return res.status(403).json({ error: 'Access denied' });

  try {
    const result = await pool.query(`
      SELECT t.*, 
        u.name as assigned_to_name, u.email as assigned_to_email,
        c.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.project_id = $1
      ORDER BY t.created_at DESC
    `, [req.params.projectId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:projectId/tasks (admin only)
router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const role = await getProjectRole(req.params.projectId, req.user.id);
  if (!role) return res.status(403).json({ error: 'Access denied' });
  if (role !== 'admin') return res.status(403).json({ error: 'Admin access required to create tasks' });

  const { title, description, assigned_to, due_date, priority, status } = req.body;
  try {
    // Validate assignee is project member if specified
    if (assigned_to) {
      const memberCheck = await pool.query(
        'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
        [req.params.projectId, assigned_to]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }
    const result = await pool.query(`
      INSERT INTO tasks (title, description, project_id, assigned_to, created_by, due_date, priority, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [title, description || null, req.params.projectId, assigned_to || null, req.user.id, due_date || null, priority || 'medium', status || 'todo']);

    const task = result.rows[0];
    // Fetch with user info
    const full = await pool.query(`
      SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.id = $1
    `, [task.id]);
    res.status(201).json(full.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:projectId/tasks/:id
router.put('/:id', async (req, res) => {
  const role = await getProjectRole(req.params.projectId, req.user.id);
  if (!role) return res.status(403).json({ error: 'Access denied' });

  try {
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1 AND project_id = $2', [req.params.id, req.params.projectId]);
    if (taskResult.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    const task = taskResult.rows[0];

    // Members can only update status of tasks assigned to them
    if (role === 'member') {
      if (task.assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'You can only update tasks assigned to you' });
      }
      // Members can only change status
      const { status } = req.body;
      if (!status || !['todo', 'in_progress', 'done'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const result = await pool.query(
        'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, req.params.id]
      );
      return res.json(result.rows[0]);
    }

    // Admin can update everything
    const { title, description, assigned_to, due_date, priority, status } = req.body;
    const result = await pool.query(`
      UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        assigned_to = $3,
        due_date = $4,
        priority = COALESCE($5, priority),
        status = COALESCE($6, status),
        updated_at = NOW()
      WHERE id = $7 AND project_id = $8 RETURNING *
    `, [title, description, assigned_to || null, due_date || null, priority, status, req.params.id, req.params.projectId]);

    const full = await pool.query(`
      SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
      FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to LEFT JOIN users c ON c.id = t.created_by
      WHERE t.id = $1
    `, [result.rows[0].id]);
    res.json(full.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:projectId/tasks/:id (admin only)
router.delete('/:id', async (req, res) => {
  const role = await getProjectRole(req.params.projectId, req.user.id);
  if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  try {
    await pool.query('DELETE FROM tasks WHERE id = $1 AND project_id = $2', [req.params.id, req.params.projectId]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
