const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard - aggregated stats for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all projects user is part of
    const projects = await pool.query(`
      SELECT p.id FROM projects p
      JOIN project_members pm ON pm.project_id = p.id
      WHERE pm.user_id = $1
    `, [userId]);

    const projectIds = projects.rows.map(p => p.id);

    if (projectIds.length === 0) {
      return res.json({
        totalTasks: 0,
        tasksByStatus: { todo: 0, in_progress: 0, done: 0 },
        overdueTasks: 0,
        myTasks: 0,
        recentTasks: [],
        tasksByUser: [],
        projectCount: 0,
      });
    }

    // Total tasks across all user's projects
    const totalResult = await pool.query(
      'SELECT COUNT(*) as count FROM tasks WHERE project_id = ANY($1)',
      [projectIds]
    );

    // Tasks by status
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count FROM tasks
      WHERE project_id = ANY($1) GROUP BY status
    `, [projectIds]);

    // Overdue tasks (due_date < today and not done)
    const overdueResult = await pool.query(`
      SELECT COUNT(*) as count FROM tasks
      WHERE project_id = ANY($1) AND due_date < CURRENT_DATE AND status != 'done'
    `, [projectIds]);

    // My assigned tasks
    const myTasksResult = await pool.query(
      'SELECT COUNT(*) as count FROM tasks WHERE project_id = ANY($1) AND assigned_to = $2',
      [projectIds, userId]
    );

    // Tasks per user
    const tasksByUserResult = await pool.query(`
      SELECT u.name, u.id, COUNT(t.id) as task_count
      FROM users u
      JOIN tasks t ON t.assigned_to = u.id
      WHERE t.project_id = ANY($1)
      GROUP BY u.id, u.name
      ORDER BY task_count DESC
      LIMIT 10
    `, [projectIds]);

    // Recent tasks
    const recentResult = await pool.query(`
      SELECT t.*, p.name as project_name, u.name as assigned_to_name
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.project_id = ANY($1)
      ORDER BY t.created_at DESC LIMIT 5
    `, [projectIds]);

    const tasksByStatus = { todo: 0, in_progress: 0, done: 0 };
    statusResult.rows.forEach(row => {
      tasksByStatus[row.status] = parseInt(row.count);
    });

    res.json({
      totalTasks: parseInt(totalResult.rows[0].count),
      tasksByStatus,
      overdueTasks: parseInt(overdueResult.rows[0].count),
      myTasks: parseInt(myTasksResult.rows[0].count),
      recentTasks: recentResult.rows,
      tasksByUser: tasksByUserResult.rows,
      projectCount: projectIds.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
