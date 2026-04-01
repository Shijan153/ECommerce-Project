import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/AdminLogin.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/warehouses")
      .then(r => r.json())
      .then(d => setWarehouses(d.data || []))
      .catch(() => {});
  }, []);

  const handleLogin = async () => {
    if (!adminId || !password || !warehouseId) return setError("Fill all fields");
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: Number(adminId), password, warehouse_id: Number(warehouseId) })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("admin-token", data.data.token);
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
          <input type="number" placeholder="Admin ID" value={adminId} onChange={e => setAdminId(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
            <option value="">Select Warehouse *</option>
            {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>)}
          </select>
        </div>
        {error && <p className="admin-error">{error}</p>}
        <button onClick={handleLogin} disabled={loading}>{loading ? "Wait..." : "Login"}</button>
        
        <p className="create-account-link">
          Don't have an ID? <span onClick={() => navigate("/admin-register")}>Create Admin Account</span>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;