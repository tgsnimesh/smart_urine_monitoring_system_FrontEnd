// src/pages/AddDevice.jsx
import React, { useEffect, useState } from "react";
import { ref, push, set, onValue, update, remove } from "firebase/database";
import { db } from "../firebase/firebaseConfig";
import "bootstrap/dist/css/bootstrap.min.css";

import { Link } from "react-router-dom";

export default function AddDevice() {
  const [form, setForm] = useState({
    model: "ESP32_v1",
    firmwareVersion: "",
    status: "inactive",
    provisionKey: "",
    ownerHospital: "",
  });

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ type: "", msg: "" });

  // Modal state for editing
  const [editingDevice, setEditingDevice] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Listen to devices realtime
  useEffect(() => {
    const devicesRef = ref(db, "devices");
    const unsub = onValue(devicesRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.keys(data).map((k) => {
        const item = data[k] || {};
        // ensure consistent keys
        return {
          id: k,
          deviceId: item.deviceId || k,
          patientId: item.patientId ?? item.assignedPatient ?? "-1",
          model: item.model || "",
          firmwareVersion: item.firmwareVersion || "",
          status: item.status || "inactive",
          lastSeen: item.lastSeen || "",
          batteryPercent: item.batteryPercent ?? null,
          provisionKey: item.provisionKey || "",
          ownerHospital: item.ownerHospital || "",
        };
      });
      setDevices(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Create device
  const handleCreate = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: "", msg: "" });

    // Basic validation
    if (!form.model.trim())
      return setStatusMsg({ type: "danger", msg: "Model is required." });
    if (!["offline", "inactive"].includes(form.status)) {
      return setStatusMsg({
        type: "danger",
        msg: "Invalid status. Choose offline or inactive.",
      });
    }

    try {
      const newRef = push(ref(db, "devices"));
      const deviceKey = newRef.key; // push key
      const nowIso = new Date().toISOString();
      const deviceObj = {
        deviceId: deviceKey, // use push key as deviceId
        patientId: "-1", // default: not assigned
        model: form.model.trim(),
        firmwareVersion: form.firmwareVersion.trim() || "v1.0.0",
        status: form.status, // active | inactive
        lastSeen: nowIso, // initial timestamp (device will update later)
        batteryPercent: null, // device will set this later
        provisionKey: form.provisionKey.trim() || "",
        ownerHospital: form.ownerHospital.trim() || "",
      };

      await set(ref(db, `devices/${deviceKey}`), deviceObj);

      setStatusMsg({ type: "success", msg: `Device ${deviceKey} created.` });
      setForm({
        model: "ESP32_v1",
        firmwareVersion: "",
        status: "inactive",
        provisionKey: "",
        ownerHospital: "",
      });
    } catch (err) {
      console.error(err);
      setStatusMsg({
        type: "danger",
        msg: err.message || "Failed to create device.",
      });
    }
  };

  // Open edit modal
  const openEdit = (device) => {
    setEditingDevice(device);
    setEditForm({
      model: device.model || "",
      firmwareVersion: device.firmwareVersion || "",
      status: device.status || "inactive",
      provisionKey: device.provisionKey || "",
      ownerHospital: device.ownerHospital || "",
    });
  };

  // Save edits
  const saveEdit = async () => {
    if (!editingDevice) return;
    if (!editForm.model.trim())
      return setStatusMsg({ type: "danger", msg: "Model is required." });
    if (!["offline", "inactive"].includes(editForm.status)) {
      return setStatusMsg({
        type: "danger",
        msg: "Invalid status. Choose offline or inactive.",
      });
    }

    setSavingEdit(true);
    try {
      const updates = {
        model: editForm.model.trim(),
        firmwareVersion: editForm.firmwareVersion.trim() || "v1.0.0",
        status: editForm.status,
        provisionKey: editForm.provisionKey.trim() || "",
        ownerHospital: editForm.ownerHospital.trim() || "",
      };

      await update(ref(db, `devices/${editingDevice.id}`), updates);

      setStatusMsg({
        type: "success",
        msg: `Device ${editingDevice.deviceId} updated.`,
      });
      setEditingDevice(null);
      setEditForm(null);
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: "danger", msg: err.message || "Failed to update." });
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete device (disabled if device.status === "active")
  const handleDelete = async (device) => {
    if (device.status === "online") return; // safety check
    if (!window.confirm(`Delete device ${device.deviceId}?`)) return;

    try {
      // Remove device node
      await remove(ref(db, `devices/${device.id}`));

      // If device had an assigned patient, clear it (defensive)
      const pid = device.patientId;
      if (pid && pid !== "" && pid !== "-1") {
        await update(ref(db, `patients/${pid}`), { deviceId: "-1" });
      }

      setStatusMsg({
        type: "success",
        msg: `Device ${device.deviceId} deleted.`,
      });
    } catch (err) {
      console.error(err);
      setStatusMsg({
        type: "danger",
        msg: err.message || "Failed to delete device.",
      });
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3">
        <Link
          className="btn btn-outline-dark btn-sm px-3 py-2 me-4"
          to="/device-management/"
        >
          Back
        </Link>
        Add New Device
      </h3>

      {statusMsg.msg && (
        <div className={`alert alert-${statusMsg.type} py-2`} role="alert">
          {statusMsg.msg}
        </div>
      )}

      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <form onSubmit={handleCreate}>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Model</label>
                <input
                  name="model"
                  className="form-control"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Firmware Version</label>
                <input
                  name="firmwareVersion"
                  className="form-control"
                  value={form.firmwareVersion}
                  onChange={(e) =>
                    setForm({ ...form, firmwareVersion: e.target.value })
                  }
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  className="form-control"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="offline">offline</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Provision Key</label>
                <input
                  name="provisionKey"
                  className="form-control"
                  value={form.provisionKey}
                  onChange={(e) =>
                    setForm({ ...form, provisionKey: e.target.value })
                  }
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Owner Hospital</label>
                <input
                  name="ownerHospital"
                  className="form-control"
                  value={form.ownerHospital}
                  onChange={(e) =>
                    setForm({ ...form, ownerHospital: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-secondary me-2"
                onClick={() =>
                  setForm({
                    model: "ESP32_v1",
                    firmwareVersion: "",
                    status: "offline",
                    provisionKey: "",
                    ownerHospital: "",
                  })
                }
              >
                Reset
              </button>
              <button className="btn btn-primary" type="submit">
                Create Device
              </button>
            </div>
          </form>
        </div>
      </div>

      <h5 className="mb-3">Registered Devices</h5>

      {loading ? (
        <div>Loading devices...</div>
      ) : devices.length === 0 ? (
        <div className="alert alert-info">No devices registered.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-bordered align-middle">
            <thead className="table-dark">
              <tr>
                <th>Device ID</th>
                <th>Model</th>
                <th>Firmware</th>
                <th>Status</th>
                <th>Battery</th>
                <th>Last Seen</th>
                <th>Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id}>
                  <td className="fw-semibold">{d.deviceId}</td>
                  <td>{d.model}</td>
                  <td>{d.firmwareVersion}</td>
                  <td>
                    <span
                      className={`badge ${
                        d.status === "online" ? "bg-success" : "bg-secondary"
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td>{d.batteryPercent ?? "—"}</td>
                  <td>{d.lastSeen || "—"}</td>
                  <td>{d.ownerHospital || "—"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => openEdit(d)}
                      disabled={d.status === "online"}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(d)}
                      disabled={d.status === "online"}
                      title={
                        d.status === "online"
                          ? "Cannot delete active device"
                          : "Delete device"
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingDevice && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Edit Device: {editingDevice.deviceId}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => {
                    setEditingDevice(null);
                    setEditForm(null);
                  }}
                ></button>
              </div>

              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Model</label>
                  <input
                    className="form-control"
                    value={editForm.model}
                    onChange={(e) =>
                      setEditForm({ ...editForm, model: e.target.value })
                    }
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label">Firmware Version</label>
                  <input
                    className="form-control"
                    value={editForm.firmwareVersion}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        firmwareVersion: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                  >
                    <option value="offline">offline</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label className="form-label">Provision Key</label>
                  <input
                    className="form-control"
                    value={editForm.provisionKey}
                    onChange={(e) =>
                      setEditForm({ ...editForm, provisionKey: e.target.value })
                    }
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label">Owner Hospital</label>
                  <input
                    className="form-control"
                    value={editForm.ownerHospital}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        ownerHospital: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-text mt-2">
                  Battery & lastSeen are reported by device, not editable here.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingDevice(null);
                    setEditForm(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={saveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
