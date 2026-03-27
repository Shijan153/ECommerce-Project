import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./CSS/DeliveryAuth.css";

const DeliveryAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    password: "", vehicle_type: "", warehouse_id: ""
  });

  useEffect(() => {
    if (location.pathname === "/delivery-register") setMode("register");
    else setMode("login");
    fetchWarehouses();
  }, [location.pathname]);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/warehouses");
      const data = await res.json();
      setWarehouses(data.data || []);
    } catch { }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    if (mode === "register") {
      if (!form.name || !form.email || !form.password || !form.warehouse_id) {
        setError("Please fill all required fields"); return;
      }
    } else {
      if (!form.email || !form.password) {
        setError("Email and password required"); return;
      }
    }

    setLoading(true);
    try {
      const endpoint = mode === "register"
        ? "http://localhost:5000/api/delivery/register"
        : "http://localhost:5000/api/delivery/login";

      const body = mode === "register"
        ? { name: form.name, email: form.email, phone: form.phone,
            password: form.password, vehicle_type: form.vehicle_type,
            warehouse_id: Number(form.warehouse_id) }
        : { email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("delivery-token", data.data.token);
        navigate("/delivery-dashboard");
      } else {
        setError(data.message || "Failed");
      }
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="delivery-auth-page">
      <div className="delivery-auth-box">
        <div className="delivery-auth-header">
          <div className="delivery-icon">🚴</div>
          <h1>{mode === "register" ? "Join as Delivery Partner" : "Delivery Login"}</h1>
          <p>Shopper Delivery Network</p>
        </div>

        <div className="delivery-auth-fields">
          {mode === "register" && (
            <>
              <input name="name" placeholder="Full Name *" value={form.name} onChange={handleChange} />
              <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
            </>
          )}
          <input name="email" type="email" placeholder="Email Address *" value={form.email} onChange={handleChange} />
          <input name="password" type="password" placeholder="Password *" value={form.password} onChange={handleChange} />

          {mode === "register" && (
            <>
              <select name="vehicle_type" value={form.vehicle_type} onChange={handleChange}>
                <option value="">Select Vehicle Type</option>
                <option value="bike">Bike</option>
                <option value="bicycle">Bicycle</option>
                <option value="van">Van</option>
                <option value="car">Car</option>
              </select>
              <select name="warehouse_id" value={form.warehouse_id} onChange={handleChange}>
                <option value="">Select Warehouse *</option>
                {warehouses.map(w => (
                  <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
                ))}
              </select>
            </>
          )}
        </div>

        {error && <p className="delivery-error">{error}</p>}

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : mode === "register" ? "Register" : "Login"}
        </button>

        <p className="delivery-toggle">
          {mode === "register" ? (
            <>Already registered? <span onClick={() => navigate("/delivery-login")}>Login here</span></>
          ) : (
            <>New delivery partner? <span onClick={() => navigate("/delivery-register")}>Register here</span></>
          )}
        </p>
      </div>
    </div>
  );
};

export default DeliveryAuth;