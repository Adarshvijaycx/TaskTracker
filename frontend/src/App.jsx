import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { authApi, taskApi } from "./api";

const emptyTask = { title: "", description: "", status: "in-progress", priority: "low", dueDate: "", completed: false };
const FILTERS = ["all", "today", "week", "high", "medium", "low"];

const bootstrapToken = import.meta.env.VITE_AUTH_TOKEN;
if (bootstrapToken && !localStorage.getItem("taskflow_token")) {
  localStorage.setItem("taskflow_token", bootstrapToken);
}

const isAuthed = () => Boolean(localStorage.getItem("taskflow_token"));

const Protected = ({ children }) => {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return children;
};

const AuthLayout = ({ title, subtitle, children }) => (
  <main className="auth-page">
    <section className="auth-card">
      <h1 className="brand">TaskTracker</h1>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      {children}
    </section>
  </main>
);

const TaskItem = ({ task, onStatusChange, onPriorityChange, onDelete }) => (
  <article className="task-card" key={task._id}>
    <div className="task-head">
      <div className="task-head-main">
        <span className={`task-dot ${(task.completed || task.status === "done") ? "done" : "active"}`} />
        <h4 className={(task.completed || task.status === "done") ? "done" : ""}>{task.title}</h4>
        <span className={`priority-badge ${(task.priority || "low").toLowerCase()}`}>{task.priority || "low"}</span>
      </div>
      <span className="task-menu">⋮</span>
    </div>
    <p>{task.description || "No description"}</p>
    <small>
      <span className="due-label">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}</span>
      <span className="due-label">Created: {new Date(task.createdAt || Date.now()).toLocaleDateString()}</span>
    </small>
    <div className="task-actions">
      <select value={task.status} onChange={(e) => onStatusChange(task._id, e.target.value)}>
        <option value="todo">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Completed</option>
      </select>
      <select value={task.priority || "low"} onChange={(e) => onPriorityChange(task._id, e.target.value)}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <button className="danger" onClick={() => onDelete(task._id)}>Delete</button>
    </div>
  </article>
);

const LeftSidebar = ({ user, onLogout, progress }) => (
  <aside className="left-sidebar panel-card">
    <div className="hello-card">
      <div className="avatar-circle">x</div>
      <div>
        <h3>Hey, {user?.name?.split(" ")[0] || "xyz"}</h3>
        <p>Let&apos;s crush some tasks!</p>
      </div>
    </div>

    <div className="mini-card">
      <div className="mini-head">
        <strong><span className="mini-icon">◉</span> PRODUCTIVITY</strong>
        <span>{progress.completionRate}%</span>
      </div>
      <div className="progress-line"><span style={{ width: `${progress.completionRate}%` }} /></div>
    </div>

    <nav className="menu-list">
      <NavLink to="/dashboard"><span className="nav-icon">⌂</span>Dashboard</NavLink>
      <NavLink to="/pending"><span className="nav-icon">☑</span>Pending Tasks</NavLink>
      <NavLink to="/completed"><span className="nav-icon">◉</span>Completed Tasks</NavLink>
      <NavLink to="/profile"><span className="nav-icon">⚙</span>Profile</NavLink>
    </nav>

    <div className="sidebar-user">
      <span>{user?.name}</span>
      <button className="ghost" onClick={onLogout}>Logout</button>
    </div>
  </aside>
);

const RightRail = ({ progress, recentActivities = [] }) => (
  <aside className="right-rail">
    <section className="panel-card">
      <h3><span className="section-icon">↗</span>Task Statistics</h3>
      <div className="stats-mini-grid">
        <div><strong>{progress.total}</strong><span>Total Tasks</span></div>
        <div><strong>{progress.completed}</strong><span>Completed</span></div>
        <div><strong>{progress.pending}</strong><span>Pending</span></div>
        <div><strong>{progress.completionRate}%</strong><span>Completion Rate</span></div>
      </div>
      <div className="task-progress-row">
        <label>Task Progress</label>
        <small>{progress.completed} / {progress.total}</small>
      </div>
      <div className="progress-line"><span style={{ width: `${progress.completionRate}%` }} /></div>
    </section>

    <section className="panel-card recent-card">
      <h3><span className="section-icon">◷</span>Recent Activity</h3>
      {recentActivities.length === 0 ? (
        <>
          <div className="empty-icon">◷</div>
          <p>No recent activity</p>
          <small>Tasks will appear here</small>
        </>
      ) : (
        <ul className="activity-list">
          {recentActivities.map((item) => (
            <li key={item.id} className="activity-item">
              <div>
                <strong>{item.title}</strong>
                <small>{item.time}</small>
              </div>
              <span className={`activity-pill ${item.status}`}>{item.status === "done" ? "Done" : item.status === "in-progress" ? "In Progress" : "Pending"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  </aside>
);

const AppLayout = ({ user, onLogout, progress, recentActivities, children }) => (
  <main className="app-shell">
    <header className="top-header">
      <div className="brand-wrap">
        <div className="logo-badge">⚡</div>
        <h1 className="brand">TaskTracker</h1>
      </div>
      <div className="header-user">
        <span className="pill-avatar">xy</span>
        <div>
          <strong>{user?.name || "xyz"}</strong>
          <small>{user?.email || ""}</small>
        </div>
      </div>
    </header>

    <section className="workspace-grid">
      <LeftSidebar user={user} onLogout={onLogout} progress={progress} />
      <section className="main-stage">{children}</section>
      <RightRail progress={progress} recentActivities={recentActivities} />
    </section>
  </main>
);

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("taskflow_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "" });
  const [profileForm, setProfileForm] = useState({ name: "", email: "", avatar: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [activeFilter, setActiveFilter] = useState("all");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ total: 0, completed: 0, pending: 0, completionRate: 0 });

  const syncUser = (usr) => {
    setUser(usr);
    setProfileForm({ name: usr?.name || "", email: usr?.email || "", avatar: usr?.avatar || "" });
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.completed || task.status === "done").length;
    const inProgress = tasks.filter((task) => task.status === "in-progress").length;
    const todo = tasks.filter((task) => !task.completed && task.status !== "done").length;
    return { total, done, inProgress, todo };
  }, [tasks]);

  const computedProgress = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed || task.status === "done").length;
    const pending = total - completed;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pending, completionRate };
  }, [tasks]);

  const recentActivities = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5)
      .map((task) => ({
        id: task._id,
        title: task.title,
        status: task.status || "todo",
        time: new Date(task.updatedAt || task.createdAt).toLocaleDateString(),
      }));
  }, [tasks]);

  const storeSession = (payload) => {
    localStorage.setItem("taskflow_token", payload.token);
    localStorage.setItem("taskflow_user", JSON.stringify(payload.user));
    syncUser(payload.user);
  };

  const loadTasks = async () => {
    try {
      const taskData = await taskApi.list();
      setTasks(taskData.tasks || []);

      const progressResult = await taskApi.progress().catch(() => null);
      if (progressResult?.progress) {
        setProgress(progressResult.progress);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (isAuthed()) {
      loadTasks();
      authApi.me().then((data) => syncUser(data.user)).catch(() => {});
    }
  }, []);

  const onLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const payload = await authApi.login(loginForm);
      storeSession(payload);
      setMessage("Login successful");
      setLoginForm({ email: "", password: "" });
      await loadTasks();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const payload = await authApi.register(signupForm);
      storeSession(payload);
      setSignupForm({ name: "", email: "", password: "" });
      setMessage("Account created");
      await loadTasks();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onTaskSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await taskApi.create(taskForm);
      setTaskForm(emptyTask);
      await loadTasks();
      setMessage("Task created");
      setIsTaskModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onStatusChange = async (id, status) => {
    try {
      await taskApi.update(id, { status, completed: status === "done" });
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const onDelete = async (id) => {
    try {
      await taskApi.remove(id);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const onPriorityChange = async (id, priority) => {
    try {
      await taskApi.update(id, { priority });
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const onTaskStateChange = (value) => {
    if (value === "completed") {
      setTaskForm((prev) => ({ ...prev, status: "done", completed: true }));
      return;
    }
    setTaskForm((prev) => ({ ...prev, status: "in-progress", completed: false }));
  };

  const onProfileUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const data = await authApi.updateProfile(profileForm);
      localStorage.setItem("taskflow_user", JSON.stringify(data.user));
      syncUser(data.user);
      setMessage("Profile updated");
    } catch (err) {
      setError(err.message);
    }
  };

  const onPasswordUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const data = await authApi.updatePassword(passwordForm);
      setMessage(data.message || "Password updated");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setError(err.message);
    }
  };

  const onLogout = () => {
    localStorage.removeItem("taskflow_token");
    localStorage.removeItem("taskflow_user");
    setUser(null);
    setTasks([]);
    setMessage("Logged out");
    navigate("/login");
  };

  const filteredTasks = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date();
    weekEnd.setDate(now.getDate() + 7);

    return tasks.filter((task) => {
      const due = task.dueDate ? new Date(task.dueDate) : null;
      if (activeFilter === "today") {
        return due && due.toDateString() === now.toDateString();
      }
      if (activeFilter === "week") {
        return due && due >= now && due <= weekEnd;
      }
      if (["high", "medium", "low"].includes(activeFilter)) {
        return (task.priority || "low") === activeFilter;
      }
      return true;
    });
  }, [tasks, activeFilter]);

  const pendingTasks = tasks.filter((t) => !(t.completed || t.status === "done"));
  const completedTasks = tasks.filter((t) => t.completed || t.status === "done");

  const renderDashboardView = (title, source) => (
    <>
      {message ? <div className="notice success">{message}</div> : null}
      {error ? <div className="notice error">{error}</div> : null}

      <section className="headline-row panel-card">
        <div>
          <h2>{title}</h2>
          <p>Manage your tasks efficiently</p>
        </div>
        <button onClick={() => setIsTaskModalOpen(true)}>+ Add New Task</button>
      </section>

      <section className="kpi-row">
        <article className="panel-card kpi"><span className="kpi-icon" style={{fontSize: "2em"}}>⌂</span><strong style={{fontSize: "1.5em"}}>{progress.total || stats.total}</strong><span style={{fontSize: "1.1em"}}>Total Tasks</span></article>
        <article className="panel-card kpi"><span className="kpi-icon green" style={{fontSize: "2em"}}>◔</span><strong style={{fontSize: "1.5em"}}>{tasks.filter((t) => (t.priority || "low") === "low").length}</strong><span style={{fontSize: "1.1em"}}>Low Priority</span></article>
        <article className="panel-card kpi"><span className="kpi-icon amber" style={{fontSize: "2em"}}>◔</span><strong style={{fontSize: "1.5em"}}>{tasks.filter((t) => (t.priority || "low") === "medium").length}</strong><span style={{fontSize: "1.1em"}}>Medium Priority</span></article>
        <article className="panel-card kpi"><span className="kpi-icon red" style={{fontSize: "2em"}}>◔</span><strong style={{fontSize: "1.5em"}}>{tasks.filter((t) => (t.priority || "low") === "high").length}</strong><span style={{fontSize: "1.1em"}}>High Priority</span></article>
      </section>

      <section className="panel-card filter-row">
        <h3><span className="section-icon">⌁</span>All Tasks</h3>
        <div>
          {FILTERS.map((filter) => (
            <button
              key={filter}
              className={`chip ${activeFilter === filter ? "active" : ""}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === "all" ? "All" : filter[0].toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="center-grid single-column">
        <article className="panel-card task-list-panel">
          <h3>Tasks</h3>
          <div className="stack mt-12">
            {source.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">▦</div>
                <h4>No tasks found</h4>
                <p>Create your first task to get started</p>
                <button onClick={() => setIsTaskModalOpen(true)}>Add New Task</button>
              </div>
            ) : source.map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                onStatusChange={onStatusChange}
                onPriorityChange={onPriorityChange}
                onDelete={onDelete}
              />
            ))}
          </div>
        </article>
      </section>

      <button className="add-dashed" onClick={() => setIsTaskModalOpen(true)}>+ Add New Task</button>

      {isTaskModalOpen ? (
        <div className="task-modal-overlay" onClick={() => setIsTaskModalOpen(false)}>
          <div className="task-modal panel-card" onClick={(e) => e.stopPropagation()}>
            <div className="task-modal-header">
              <h3><span className="section-icon">⊕</span>Create New Task</h3>
              <button className="modal-close" onClick={() => setIsTaskModalOpen(false)}>×</button>
            </div>

            <form onSubmit={onTaskSubmit} className="stack">
              <label className="field-label">Task Title</label>
              <input
                placeholder="Enter task title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                required
              />

              <label className="field-label">Description</label>
              <textarea
                placeholder="Add details about your task"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />

              <div className="row">
                <div className="field-group">
                  <label className="field-label">Priority</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <label className="field-label">Status</label>
              <div className="row radio-row">
                <label>
                  <input
                    type="radio"
                    name="taskStatus"
                    checked={taskForm.status === "done"}
                    onChange={() => onTaskStateChange("completed")}
                  />
                  Completed
                </label>
                <label>
                  <input
                    type="radio"
                    name="taskStatus"
                    checked={taskForm.status !== "done"}
                    onChange={() => onTaskStateChange("in-progress")}
                  />
                  In Progress
                </label>
              </div>

              <button disabled={loading}>{loading ? "Saving..." : "Create Task"}</button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthLayout title="Welcome Back" subtitle="Sign in to continue to TaskTracker">
            {error ? <div className="notice error">{error}</div> : null}
            <form onSubmit={onLogin} className="stack">
              <input type="email" placeholder="Email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required />
              <input type="password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
              <button disabled={loading}>{loading ? "Please wait..." : "Login"}</button>
            </form>
            <p className="switch-text">Don't have an account? <Link to="/signup">Sign Up</Link></p>
          </AuthLayout>
        }
      />
      <Route
        path="/signup"
        element={
          <AuthLayout title="Create Account" subtitle="Start organizing your tasks">
            {error ? <div className="notice error">{error}</div> : null}
            <form onSubmit={onSignup} className="stack">
              <input placeholder="Full Name" value={signupForm.name} onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })} required />
              <input type="email" placeholder="Email" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} required />
              <input type="password" placeholder="Password" value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} required />
              <button disabled={loading}>{loading ? "Please wait..." : "Sign Up"}</button>
            </form>
            <p className="switch-text">Already have an account? <Link to="/login">Login</Link></p>
          </AuthLayout>
        }
      />

      <Route
        path="/dashboard"
        element={
          <Protected>
            <AppLayout user={user} onLogout={onLogout} progress={progress.total ? progress : computedProgress} recentActivities={recentActivities}>
              {renderDashboardView("Task Overview", filteredTasks)}
            </AppLayout>
          </Protected>
        }
      />

      <Route
        path="/pending"
        element={<Protected><AppLayout user={user} onLogout={onLogout} progress={progress.total ? progress : computedProgress} recentActivities={recentActivities}>{renderDashboardView("Pending Tasks", pendingTasks)}</AppLayout></Protected>}
      />
      <Route
        path="/completed"
        element={<Protected><AppLayout user={user} onLogout={onLogout} progress={progress.total ? progress : computedProgress} recentActivities={recentActivities}>{renderDashboardView("Completed Tasks", completedTasks)}</AppLayout></Protected>}
      />
      <Route
        path="/profile"
        element={
          <Protected>
            <AppLayout user={user} onLogout={onLogout} progress={progress.total ? progress : computedProgress} recentActivities={recentActivities}>
              {message ? <div className="notice success">{message}</div> : null}
              {error ? <div className="notice error">{error}</div> : null}
              <div className="center-grid">
                <section className="panel-card profile-panel">
                  <h2>Personal Information</h2>
                  <form onSubmit={onProfileUpdate} className="stack mt-12">
                    <input placeholder="Name" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
                    <input type="email" placeholder="Email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required />
                    <input placeholder="Avatar URL (optional)" value={profileForm.avatar} onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })} />
                    <button>Update Profile</button>
                  </form>
                </section>
                <section className="panel-card profile-panel">
                  <h2>Change Password</h2>
                  <form onSubmit={onPasswordUpdate} className="stack mt-12">
                    <input type="password" placeholder="Current password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
                    <input type="password" placeholder="New password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
                    <button>Update Password</button>
                  </form>
                </section>
              </div>
            </AppLayout>
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to={isAuthed() ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
