import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/AdminLogin.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return setError("Email and password are required");
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("admin-token", data.data.token);
        localStorage.setItem("admin-warehouse", JSON.stringify({
          warehouse_id: Number(data.data.warehouse_id),
          warehouse_name: data.data.warehouse_name || `Warehouse ${data.data.warehouse_id}`
        }));
        navigate("/admin");
      } else setError(data.message);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <h1>Admin Panel</h1>
        <div className="admin-login-fields">
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <p className="admin-error">{error}</p>}
        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Wait..." : "Login"}
        </button>
        <p className="create-account-link">
          Don't have an ID? <span onClick={() => navigate("/admin-register")}>Create Admin Account</span>
        </p>
        <div className="home-action">
          <button className="home-link" onClick={() => navigate("/")}>Home</button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;