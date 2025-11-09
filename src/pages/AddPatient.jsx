// src/pages/AddPatient.jsx
import React, { useEffect, useState } from "react";
import { ref, set, get, child, update, onValue, push } from "firebase/database";
import { db } from "../firebase/firebaseConfig";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AddPatient() {
  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "M",
    bedNo: "",
    ward: "",
    deviceId: "", // will hold selected deviceId or "" for none
    mode: "normal", // normal or ICU
    catheterInsertedDate: "",
  });

  const [status, setStatus] = useState({ type: "", msg: "" });
  const [submitting, setSubmitting] = useState(false);

  // availableDevices = [{ id: "device_001", model: "...", batteryPercent: 86, lastSeen: "..."}]
  const [availableDevices, setAvailableDevices] = useState([]);

  useEffect(() => {
    // Listen to devices and build available devices list (those without a patientId / patientId == "-1" / empty)
    const devicesRef = ref(db, "devices");
    const unsub = onValue(devicesRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.keys(data).map((k) => ({
        id: k,
        ...(data[k] || {}),
      }));

      const free = list.filter((d) => {
        // Accept devices where patientId is missing, empty string, "-1" or null
        const pid = d.patientId ?? d.patientId ?? null;
        return !pid || pid === "" || pid === -1;
      });

      setAvailableDevices(free);
    });

    return () => unsub();
  }, []);

  const handleChange = (e) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!form.dob) return "DOB is required";
    if (!form.bedNo.trim()) return "Bed number is required";
    if (!form.ward.trim()) return "Ward is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", msg: "" });

    const err = validate();
    if (err) {
      setStatus({ type: "danger", msg: err });
      return;
    }

    setSubmitting(true);

    try {
      // generate patientId using push key for uniqueness (recommended)
      const newRef = push(ref(db, "patients"));
      const patientId = newRef.key; // e.g. -Mabc123xyz

      const nowTs = Date.now();
      const urineData = {
        currentVolume_ml: 0,
        fillPercentage: 0,
        flowRate_ml_per_hr: 0,
        alertLevel: "Green",
        status: "idle",
        lastMeasurementTimestamp: nowTs,
      };

      const patientObj = {
        patientId,
        name: form.name.trim(),
        dob: form.dob,
        gender: form.gender,
        bedNo: form.bedNo.trim(),
        ward: form.ward.trim(),
        deviceId:
          form.deviceId && form.deviceId.trim() ? form.deviceId.trim() : "-1",
        catheterInsertedDate: form.catheterInsertedDate || "",
        mode: form.mode,
        lastUpdated: nowTs,
        urineData,
      };

      // If a device was selected, double-check it is still free before writing
      const selectedDeviceId =
        patientObj.deviceId !== "-1" ? patientObj.deviceId : null;
      if (selectedDeviceId) {
        const deviceSnap = await get(
          child(ref(db), `devices/${selectedDeviceId}`)
        );
        if (!deviceSnap.exists()) {
          setSubmitting(false);
          return setStatus({
            type: "danger",
            msg: `Device "${selectedDeviceId}" not found.`,
          });
        }
        const deviceData = deviceSnap.val();
        const currentPid = deviceData.patientId ?? deviceData.patientId ?? null;
        if (currentPid && currentPid !== "" && currentPid !== -1) {
          setSubmitting(false);
          return setStatus({
            type: "danger",
            msg: `Device ${selectedDeviceId} is already assigned to ${currentPid}. Choose another device or leave empty.`,
          });
        }
      }

      // Write patient using the push ref
      await set(newRef, patientObj);

      // If device assigned, update device node to set patientId (or assignedPatient)
      if (selectedDeviceId) {
        // Use whichever key your devices use; update both fields for compatibility
        const updates = {};
        updates[`devices/${selectedDeviceId}/patientId`] = patientId;
        updates[`devices/${selectedDeviceId}/status`] = "online";
        await update(ref(db), updates);
      }

      setStatus({
        type: "success",
        msg: `Patient ${patientObj.name} added (ID: ${patientId}).`,
      });

      // reset form
      setForm({
        name: "",
        dob: "",
        gender: "M",
        bedNo: "",
        ward: "",
        deviceId: "",
        mode: "normal",
        catheterInsertedDate: "",
      });
    } catch (error) {
      console.error("Add patient error:", error);
      setStatus({
        type: "danger",
        msg: error.message || "Failed to add patient",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Add New Patient</h3>

      {status.msg && (
        <div className={`alert alert-${status.type}`} role="alert">
          {status.msg}
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Full Name</label>
                <input
                  name="name"
                  className="form-control"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter new patient full name here..."
                  required
                />
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label">Date of Birth</label>
                <input
                  name="dob"
                  type="date"
                  className="form-control"
                  value={form.dob}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label">Gender</label>
                <select
                  name="gender"
                  className="form-control"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Bed No</label>
                <input
                  name="bedNo"
                  className="form-control"
                  value={form.bedNo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Ward</label>
                <input
                  name="ward"
                  className="form-control"
                  value={form.ward}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Mode</label>
                <select
                  name="mode"
                  className="form-control"
                  value={form.mode}
                  onChange={handleChange}
                >
                  <option value="normal">Normal</option>
                  <option value="ICU">ICU</option>
                </select>
              </div>
            </div>

            <div className="row">
              {/* Device selector (replaces free text device input) */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Assign Device (optional)</label>
                <select
                  name="deviceId"
                  className="form-control"
                  value={form.deviceId}
                  onChange={handleChange}
                >
                  <option value="">-- No device --</option>
                  {availableDevices.length === 0 && (
                    <option disabled> No available devices</option>
                  )}
                  {availableDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} - {d.model || "unknown model"}{" "}
                      {d.batteryPercent ? `(${d.batteryPercent}% battery)` : ""}
                    </option>
                  ))}
                </select>
                <div className="form-text">
                  Select an available device to attach to this patient
                  (optional).
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Catheter Inserted Date (optional)
                </label>
                <input
                  name="catheterInsertedDate"
                  type="date"
                  className="form-control"
                  value={form.catheterInsertedDate}
                  onChange={handleChange}
                />
                <div className="form-text">
                  Optional - the system uses this to calculate days of usage.
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <button
                className="btn btn-secondary me-2"
                type="reset"
                onClick={() => {
                  setForm({
                    name: "",
                    dob: "",
                    gender: "M",
                    bedNo: "",
                    ward: "",
                    deviceId: "",
                    mode: "normal",
                    catheterInsertedDate: "",
                  });
                  setStatus({ type: "", msg: "" });
                }}
              >
                Reset
              </button>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Add Patient"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
