import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/AdminPanel.css";

const STATUS_OPTIONS = ["pending","confirmed","assigned","picked","on_the_way","delivered","cancelled"];

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${status}`}>{status?.replace("_", " ")}</span>
);

const AdminPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin-token");

  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [deliveryMen, setDeliveryMen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newDeliveryMan, setNewDeliveryMan] = useState({
    name: "", email: "", phone: "", password: "", vehicle_type: ""
  });
  const [addingDM, setAddingDM] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!token) { navigate("/admin-login"); return; }
    fetchOrders();
    fetchDeliveryMen();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/orders", { headers });
      const data = await res.json();
      if (res.ok) setOrders(data.data || []);
      else if (res.status === 401) navigate("/admin-login");
    } catch { setError("Failed to fetch orders"); }
    finally { setLoading(false); }
  };

  const fetchDeliveryMen = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/delivery-men", { headers });
      const data = await res.json();
      if (res.ok) setDeliveryMen(data.data || []);
    } catch { setError("Failed to fetch delivery men"); }
  };

  const handleAssign = async (order_id, deliveryman_id) => {
    if (!deliveryman_id) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${order_id}/assign`, {
        method: "PUT", headers,
        body: JSON.stringify({ deliveryman_id: Number(deliveryman_id) })
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.map(o =>
          o.order_id === order_id
            ? { ...o, deliveryman_id: Number(deliveryman_id), order_status: "assigned",
                deliveryman_name: deliveryMen.find(d => d.deliveryman_id === Number(deliveryman_id))?.name }
            : o
        ));
      } else setError(data.message);
    } catch { setError("Failed to assign delivery man"); }
  };

  const handleStatusChange = async (order_id, order_status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${order_id}/status`, {
        method: "PUT", headers,
        body: JSON.stringify({ order_status })
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.map(o =>
          o.order_id === order_id ? { ...o, order_status } : o
        ));
      } else setError(data.message);
    } catch { setError("Failed to update status"); }
  };

  const handleAddDeliveryMan = async () => {
    if (!newDeliveryMan.name || !newDeliveryMan.password) {
      setError("Name and password are required"); return;
    }
    setAddingDM(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/delivery-men", {
        method: "POST", headers,
        body: JSON.stringify(newDeliveryMan)
      });
      const data = await res.json();
      if (res.ok) {
        setDeliveryMen(prev => [data.data, ...prev]);
        setNewDeliveryMan({ name: "", email: "", phone: "", password: "", vehicle_type: "" });
        setShowAddForm(false);
        setError("");
      } else setError(data.message);
    } catch { setError("Failed to add delivery man"); }
    finally { setAddingDM(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-token");
    navigate("/admin-login");
  };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-panel">
      <div className="admin-sidebar">
        <div className="admin-brand">
          <h2>Admin Panel</h2>
          <p>Shopper</p>
        </div>
        <nav className="admin-nav">
          <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>
            Orders
          </button>
          <button className={activeTab === "delivery" ? "active" : ""} onClick={() => setActiveTab("delivery")}>
            Delivery Men
          </button>
        </nav>
        <button className="admin-logout" onClick={handleLogout}>Logout</button>
      </div>

      <div className="admin-content">
        {error && <div className="admin-error-banner" onClick={() => setError("")}>{error} ✕</div>}

        {activeTab === "orders" && (
          <div className="admin-section">
            <div className="section-header">
              <h2>All Orders</h2>
              <span className="count-badge">{orders.length} orders</span>
            </div>
            <div className="orders-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Assign Delivery</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.order_id}>
                      <td><strong>#{order.order_id}</strong></td>
                      <td>
                        <div>{order.phone_number}</div>
                        <div className="sub-text">{order.shipping_address?.substring(0, 30)}...</div>
                      </td>
                      <td><strong>${parseFloat(order.total_amount).toFixed(2)}</strong></td>
                      <td>
                        <span className={`payment-badge ${order.payment_status}`}>
                          {order.payment_method} / {order.payment_status}
                        </span>
                      </td>
                      <td><StatusBadge status={order.order_status} /></td>
                      <td>
                        <select
                          className="assign-select"
                          value={order.deliveryman_id || ""}
                          onChange={e => handleAssign(order.order_id, e.target.value)}
                        >
                          <option value="">-- Select --</option>
                          {deliveryMen.map(dm => (
                            <option key={dm.deliveryman_id} value={dm.deliveryman_id}>
                              {dm.name} ({dm.vehicle_type || "N/A"})
                            </option>
                          ))}
                        </select>
                        {order.deliveryman_name && (
                          <div className="assigned-name">✓ {order.deliveryman_name}</div>
                        )}
                      </td>
                      <td>
                        <select
                          className="status-select"
                          value={order.order_status || "pending"}
                          onChange={e => handleStatusChange(order.order_id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s.replace("_", " ")}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <p className="empty-msg">No orders yet</p>}
            </div>
          </div>
        )}

        {activeTab === "delivery" && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Delivery Men</h2>
              <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? "Cancel" : "+ Add New"}
              </button>
            </div>

            {showAddForm && (
              <div className="add-form">
                <h3>Add Delivery Man</h3>
                <div className="add-form-grid">
                  <input placeholder="Full Name *" value={newDeliveryMan.name}
                    onChange={e => setNewDeliveryMan({...newDeliveryMan, name: e.target.value})} />
                  <input placeholder="Email" value={newDeliveryMan.email}
                    onChange={e => setNewDeliveryMan({...newDeliveryMan, email: e.target.value})} />
                  <input placeholder="Phone" value={newDeliveryMan.phone}
                    onChange={e => setNewDeliveryMan({...newDeliveryMan, phone: e.target.value})} />
                  <input placeholder="Password *" type="password" value={newDeliveryMan.password}
                    onChange={e => setNewDeliveryMan({...newDeliveryMan, password: e.target.value})} />
                  <select value={newDeliveryMan.vehicle_type}
                    onChange={e => setNewDeliveryMan({...newDeliveryMan, vehicle_type: e.target.value})}>
                    <option value="">Vehicle Type</option>
                    <option value="bike">Bike</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="van">Van</option>
                    <option value="car">Car</option>
                  </select>
                </div>
                <button className="save-btn" onClick={handleAddDeliveryMan} disabled={addingDM}>
                  {addingDM ? "Adding..." : "Add Delivery Man"}
                </button>
              </div>
            )}

            <div className="delivery-grid">
              {deliveryMen.map(dm => (
                <div key={dm.deliveryman_id} className="delivery-card">
                  <div className="dm-avatar">{dm.name?.charAt(0).toUpperCase()}</div>
                  <div className="dm-info">
                    <h4>{dm.name}</h4>
                    <p>{dm.email || "No email"}</p>
                    <p>{dm.phone || "No phone"}</p>
                    <span className="vehicle-badge">{dm.vehicle_type || "N/A"}</span>
                  </div>
                </div>
              ))}
              {deliveryMen.length === 0 && <p className="empty-msg">No delivery men added yet</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;