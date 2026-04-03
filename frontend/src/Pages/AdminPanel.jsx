import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/AdminPanel.css";

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${status}`}>{status?.replace(/_/g, " ")}</span>
);

// Statuses admin is NOT allowed to change — these belong to delivery man only
const DELIVERY_ONLY_STATUSES = ["picked", "on_the_way", "delivered"];

const AdminPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin-token");
  const adminWarehouse = JSON.parse(localStorage.getItem("admin-warehouse") || "null");

  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [deliveryMen, setDeliveryMen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delivery man form
  const [newDeliveryMan, setNewDeliveryMan] = useState({
    name: "", email: "", phone: "", password: "", vehicle_type: ""
  });
  const [addingDM, setAddingDM] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Promo code state
  const [promoCodes, setPromoCodes] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSaving, setPromoSaving] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoForm, setPromoForm] = useState({
    code: "", discount_percentage: "", min_buy_amount: "", max_discount_amount: "", usage_limit: "", is_active: true
  });
  const [promoSuccess, setPromoSuccess] = useState("");

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  useEffect(() => {
    if (!token) { navigate("/admin-login"); return; }
    fetchOrders();
    fetchDeliveryMen();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === "promo") fetchPromoCodes();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const fetchPromoCodes = async () => {
    setPromoLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/promo-codes", { headers });
      const data = await res.json();
      if (res.ok) setPromoCodes(data.data || []);
      else setError(data.message);
    } catch { setError("Failed to fetch promo codes"); }
    finally { setPromoLoading(false); }
  };

  const handleSendToCustomerWarehouse = async (order_id) => {
    if (!window.confirm("Send this order to the customer's warehouse?")) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/orders/${order_id}/send-to-customer-warehouse`,
        { method: "PUT", headers }
      );
      const data = await res.json();
      if (res.ok) fetchOrders();
      else setError(data.message);
    } catch { setError("Failed to send to customer warehouse"); }
  };

  const handleAssignDeliveryman = async (order_id, deliveryman_id) => {
    if (!deliveryman_id) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/orders/${order_id}/assign`,
        { method: "PUT", headers, body: JSON.stringify({ deliveryman_id: Number(deliveryman_id) }) }
      );
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.map(o =>
          o.order_id === order_id
            ? {
                ...o,
                deliveryman_id: Number(deliveryman_id),
                order_status: "assigned",
                deliveryman_name: deliveryMen.find(d => d.deliveryman_id === Number(deliveryman_id))?.name
              }
            : o
        ));
      } else setError(data.message);
    } catch { setError("Failed to assign delivery man"); }
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

  // ── Promo Code Handlers ──────────────────────────────────────────────────
  const resetPromoForm = () => {
    setPromoForm({ code: "", discount_percentage: "", min_buy_amount: "", max_discount_amount: "", usage_limit: "", is_active: true });
    setEditingPromo(null);
    setShowPromoForm(false);
    setPromoSuccess("");
  };

  const handlePromoFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPromoForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSavePromo = async () => {
    setError("");
    setPromoSuccess("");

    const { code, discount_percentage, min_buy_amount, max_discount_amount, usage_limit } = promoForm;
    if (!code.trim() || !discount_percentage || min_buy_amount === "" || !max_discount_amount || usage_limit === "") {
      setError("All promo fields are required"); return;
    }
    if (parseFloat(discount_percentage) <= 0 || parseFloat(discount_percentage) > 100) {
      setError("Discount must be between 1 and 100"); return;
    }
    if (parseFloat(min_buy_amount) < 0) {
      setError("Minimum buy cannot be negative"); return;
    }
    if (parseFloat(max_discount_amount) <= 0) {
      setError("Max discount must be greater than 0"); return;
    }
    if (Number(usage_limit) < 0) {
      setError("Usage limit cannot be negative"); return;
    }

    setPromoSaving(true);
    try {
      console.log("Saving promo code", editingPromo, promoForm);

      const url = editingPromo
        ? `http://localhost:5000/api/admin/promo-codes/${editingPromo.promo_id}`
        : "http://localhost:5000/api/admin/promo-codes";
      const method = editingPromo ? "PUT" : "POST";

      const res = await fetch(url, {
        method, headers,
        body: JSON.stringify({
          code: promoForm.code,
          discount_percentage: parseFloat(promoForm.discount_percentage),
          min_buy_amount: parseFloat(promoForm.min_buy_amount),
          max_discount_amount: parseFloat(promoForm.max_discount_amount),
          usage_limit: Number(promoForm.usage_limit),
          is_active: promoForm.is_active
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPromoSuccess(editingPromo ? "Promo code updated!" : "Promo code created!");
        resetPromoForm();
        fetchPromoCodes();
      } else {
        setError(data.message || "Promo call failed");
      }
    } catch (err) {
      console.error("Error saving promo code:", err);
      setError("Failed to save promo code");
    } finally {
      setPromoSaving(false);
    }
  };

  const handleEditPromo = (promo) => {
    setEditingPromo(promo);
    setPromoForm({
      code: promo.code,
      discount_percentage: promo.discount_percentage,
      min_buy_amount: promo.min_buy_amount,
      max_discount_amount: promo.max_discount_amount,
      usage_limit: promo.usage_limit ?? "",
      is_active: promo.is_active
    });
    setShowPromoForm(true);
    setPromoSuccess("");
    setError("");
  };

  const handleDeletePromo = async (promo_id) => {
    if (!window.confirm("Delete this promo code?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/promo-codes/${promo_id}`, {
        method: "DELETE", headers
      });
      const data = await res.json();
      if (res.ok) {
        setPromoCodes(prev => prev.filter(p => p.promo_id !== promo_id));
        setPromoSuccess("Promo code deleted.");
      } else setError(data.message);
    } catch { setError("Failed to delete promo code"); }
  };

  const handleTogglePromoActive = async (promo) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/promo-codes/${promo.promo_id}`, {
        method: "PUT", headers,
        body: JSON.stringify({ ...promo, is_active: !promo.is_active })
      });
      const data = await res.json();
      if (res.ok) fetchPromoCodes();
      else setError(data.message);
    } catch { setError("Failed to toggle promo"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-token");
    localStorage.removeItem("admin-warehouse");
    navigate("/admin-login");
  };

  const DeliverySelect = ({ order }) => (
    deliveryMen.length === 0
      ? <span className="ready-text">No delivery men available.</span>
      : (
        <>
          <select
            className="assign-select"
            value={order.deliveryman_id || ""}
            onChange={e => handleAssignDeliveryman(order.order_id, e.target.value)}
          >
            <option value="">-- Select Delivery Man --</option>
            {deliveryMen.map(dm => (
              <option key={dm.deliveryman_id} value={dm.deliveryman_id}>
                {dm.name} ({dm.vehicle_type || "N/A"})
              </option>
            ))}
          </select>
          {order.deliveryman_name && (
            <div className="assigned-name">✓ {order.deliveryman_name}</div>
          )}
        </>
      )
  );

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-panel">
      <div className="admin-sidebar">
        <div className="admin-brand">
          <h2>Admin Panel</h2>
          <p>Shopper</p>
          {adminWarehouse && (
            <span className="admin-warehouse-tag">🏭 {adminWarehouse.warehouse_name}</span>
          )}
        </div>
        <nav className="admin-nav">
          <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>
            Orders
          </button>
          <button className={activeTab === "delivery" ? "active" : ""} onClick={() => setActiveTab("delivery")}>
            Delivery Men
          </button>
          <button className={activeTab === "promo" ? "active" : ""} onClick={() => setActiveTab("promo")}>
            Promo Codes
          </button>
        </nav>
        <button className="admin-logout" onClick={handleLogout}>Logout</button>
      </div>

      <div className="admin-content">
        {error && (
          <div className="admin-error-banner" onClick={() => setError("")}>{error} ✕</div>
        )}

        {/* ── Orders Tab ── */}
        {activeTab === "orders" && (
          <div className="admin-section">
            <div className="section-header">
              <h2>All Orders</h2>
              <span className="count-badge">{orders.length} orders</span>
              <button className="add-btn" style={{ marginLeft: "auto" }} onClick={fetchOrders}>
                ↻ Refresh
              </button>
            </div>

            <div className="orders-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Warehouse Action</th>
                    <th>Delivery Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const myWH = Number(adminWarehouse?.warehouse_id);
                    const srcWH = Number(order.source_warehouse_id);
                    const dstWH = Number(order.destination_warehouse_id);
                    const sameWarehouse = srcWH === dstWH;
                    const iAmSellerAdmin = myWH === srcWH;
                    const iAmCustomerAdmin = myWH === dstWH;
                    const status = order.order_status;
                    const isDeliveryOnlyStatus = DELIVERY_ONLY_STATUSES.includes(status);

                    return (
                      <tr key={order.order_id}>
                        <td><strong>#{order.order_id}</strong></td>
                        <td><strong>${parseFloat(order.total_amount).toFixed(2)}</strong></td>
                        <td>
                          <span className={`payment-badge ${order.payment_status}`}>
                            {order.payment_method} / {order.payment_status}
                          </span>
                        </td>
                        <td><StatusBadge status={status} /></td>

                        {/* ── Warehouse Action ── */}
                        <td>
                          {iAmSellerAdmin && !sameWarehouse && status === "sent_seller_wh" && (
                            <button
                              className="warehouse-action-btn"
                              onClick={() => handleSendToCustomerWarehouse(order.order_id)}
                            >
                              Send to Customer Warehouse
                            </button>
                          )}
                          {iAmSellerAdmin && !sameWarehouse && status === "sent_customer_wh" && (
                            <span className="ready-text">📦 In transit to customer warehouse</span>
                          )}
                          {iAmCustomerAdmin && !sameWarehouse && status === "sent_customer_wh" && (
                            <span className="ready-text">✓ Order arrived — assign delivery man →</span>
                          )}
                          {sameWarehouse && iAmSellerAdmin && status === "sent_seller_wh" && (
                            <span className="ready-text">Same warehouse — assign directly →</span>
                          )}
                          {/* Read-only label for delivery-stage orders */}
                          {isDeliveryOnlyStatus && (
                            <span className="delivery-only-tag">🚴 With delivery man</span>
                          )}
                        </td>

                        {/* ── Delivery Action ── */}
                        <td>
                          {/* Assignment dropdowns — only when order is ready */}
                          {sameWarehouse && iAmSellerAdmin && status === "sent_seller_wh" && (
                            <DeliverySelect order={order} />
                          )}
                          {iAmCustomerAdmin && !sameWarehouse && status === "sent_customer_wh" && (
                            <DeliverySelect order={order} />
                          )}

                          {/* 
                            Admin can only see status for assigned orders — 
                            picked / on_the_way / delivered are delivery man only.
                            We show a read-only status badge for those.
                          */}
                          {status === "assigned" && (
                            <div className="assigned-info">
                              <span className="status-badge status-assigned">Assigned</span>
                              {order.deliveryman_name && (
                                <div className="assigned-name">✓ {order.deliveryman_name}</div>
                              )}
                              <div className="delivery-only-note">
                                Delivery man will update further statuses
                              </div>
                            </div>
                          )}

                          {isDeliveryOnlyStatus && (
                            <div className="assigned-info">
                              <StatusBadge status={status} />
                              {order.deliveryman_name && (
                                <div className="assigned-name">✓ {order.deliveryman_name}</div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {orders.length === 0 && <p className="empty-msg">No orders for your warehouse yet</p>}
            </div>
          </div>
        )}

        {/* ── Delivery Men Tab ── */}
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
                    onChange={e => setNewDeliveryMan({ ...newDeliveryMan, name: e.target.value })} />
                  <input placeholder="Email" value={newDeliveryMan.email}
                    onChange={e => setNewDeliveryMan({ ...newDeliveryMan, email: e.target.value })} />
                  <input placeholder="Phone" value={newDeliveryMan.phone}
                    onChange={e => setNewDeliveryMan({ ...newDeliveryMan, phone: e.target.value })} />
                  <input placeholder="Password *" type="password" value={newDeliveryMan.password}
                    onChange={e => setNewDeliveryMan({ ...newDeliveryMan, password: e.target.value })} />
                  <select value={newDeliveryMan.vehicle_type}
                    onChange={e => setNewDeliveryMan({ ...newDeliveryMan, vehicle_type: e.target.value })}>
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

        {/* ── Promo Codes Tab ── */}
        {activeTab === "promo" && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Promo Codes</h2>
              <button className="add-btn" onClick={() => { resetPromoForm(); setShowPromoForm(!showPromoForm); }}>
                {showPromoForm && !editingPromo ? "Cancel" : "+ Create New"}
              </button>
            </div>

            {promoSuccess && (
              <div className="promo-success-banner" onClick={() => setPromoSuccess("")}>
                ✓ {promoSuccess}
              </div>
            )}

            {(showPromoForm || editingPromo) && (
              <div className="add-form">
                <h3>{editingPromo ? "Edit Promo Code" : "Create Promo Code"}</h3>
                <div className="promo-form-grid">
                  <div className="promo-field">
                    <label>Promo Code *</label>
                    <input
                      name="code"
                      placeholder="e.g. SAVE20"
                      value={promoForm.code}
                      onChange={handlePromoFormChange}
                      style={{ textTransform: "uppercase" }}
                    />
                  </div>
                  <div className="promo-field">
                    <label>Discount % *</label>
                    <input
                      name="discount_percentage"
                      type="number"
                      placeholder="e.g. 15"
                      min="1" max="100"
                      value={promoForm.discount_percentage}
                      onChange={handlePromoFormChange}
                    />
                  </div>
                  <div className="promo-field">
                    <label>Minimum Cart Value ($) *</label>
                    <input
                      name="min_buy_amount"
                      type="number"
                      placeholder="e.g. 50"
                      min="0"
                      value={promoForm.min_buy_amount}
                      onChange={handlePromoFormChange}
                    />
                  </div>
                  <div className="promo-field">
                    <label>Max Discount Amount ($) *</label>
                    <input
                      name="max_discount_amount"
                      type="number"
                      placeholder="e.g. 20"
                      min="0"
                      value={promoForm.max_discount_amount}
                      onChange={handlePromoFormChange}
                    />
                  </div>
                  <div className="promo-field">
                    <label>Usage Limit (0 = unlimited) *</label>
                    <input
                      name="usage_limit"
                      type="number"
                      placeholder="e.g. 100"
                      min="0"
                      value={promoForm.usage_limit}
                      onChange={handlePromoFormChange}
                    />
                  </div>
                </div>

                {/* Preview box */}
                {promoForm.discount_percentage && promoForm.min_buy_amount !== "" && promoForm.max_discount_amount && (
                  <div className="promo-preview">
                    <strong>Preview:</strong> Code <em>{promoForm.code || "???"}</em> gives{" "}
                    <strong>{promoForm.discount_percentage}% off</strong> on orders over{" "}
                    <strong>${promoForm.min_buy_amount}</strong>, up to a max discount of{" "}
                    <strong>${promoForm.max_discount_amount}</strong>.
                  </div>
                )}

                {editingPromo && (
                  <div className="promo-active-toggle">
                    <label>
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={promoForm.is_active}
                        onChange={handlePromoFormChange}
                      />
                      &nbsp; Active
                    </label>
                  </div>
                )}

                <div className="promo-form-actions">
                  <button className="save-btn" type="button" onClick={handleSavePromo} disabled={promoSaving}>
                    {promoSaving ? (editingPromo ? "Updating..." : "Creating...") : (editingPromo ? "Update Promo Code" : "Create Promo Code")}
                  </button>
                  {editingPromo && (
                    <button className="cancel-edit-btn" type="button" onClick={resetPromoForm}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            {promoLoading ? (
              <p className="empty-msg">Loading promo codes...</p>
            ) : (
              <div className="promo-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Discount %</th>
                      <th>Min Buy ($)</th>
                      <th>Max Discount ($)</th>
                      <th>Usage Used/Limit</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map(promo => (
                      <tr key={promo.promo_id}>
                        <td><strong className="promo-code-text">{promo.code}</strong></td>
                        <td>{parseFloat(promo.discount_percentage).toFixed(1)}%</td>
                        <td>${parseFloat(promo.min_buy_amount).toFixed(2)}</td>
                        <td>${parseFloat(promo.max_discount_amount).toFixed(2)}</td>
                        <td>{promo.used_count || 0}/{promo.usage_limit || "∞"}</td>
                        <td>
                          <span
                            className={`promo-status-badge ${promo.is_active ? "active" : "inactive"}`}
                            style={{ cursor: "pointer" }}
                            title="Click to toggle"
                            onClick={() => handleTogglePromoActive(promo)}
                          >
                            {promo.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>{new Date(promo.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="promo-actions">
                            <button className="promo-edit-btn" onClick={() => handleEditPromo(promo)}>Edit</button>
                            <button className="promo-delete-btn" onClick={() => handleDeletePromo(promo.promo_id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {promoCodes.length === 0 && <p className="empty-msg">No promo codes created yet</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;