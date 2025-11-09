import { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../firebase/firebaseConfig";
import "bootstrap/dist/css/bootstrap.min.css";

import { Link } from "react-router-dom";

export default function DeviceManagement() {
  const [devices, setDevices] = useState([]);
  const [freePatients, setFreePatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    const devicesRef = ref(db, "devices");
    onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map((id) => ({ id, ...data[id] }));
        setDevices(list);
      }
      setLoading(false);
    });

    const patientsRef = ref(db, "patients");
    onValue(patientsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map((id) => ({ id, ...data[id] }));

        // Filter: patient with no device assigned
        const freePatients = list.filter(
          (p) => p.deviceId == "-1" || !p.deviceId
        );
        setFreePatients(freePatients);
        console.log(freePatients);
      }
    });
  }, []);

  const handleDeactivate = async (deviceId) => {
    if (window.confirm("Are you sure you want to deactivate this device?")) {
      await update(ref(db, `devices/${deviceId}`), {
        patientId: -1,
      });
      const item = devices.filter((item) => {
        if (item.deviceId === deviceId) {
          return item;
        }
      });
      await update(ref(db, `/patients/${item[0].patientId}`), {
        deviceId: -1,
      });
      await update(ref(db, `devices/${deviceId}`), {
        status: "offline",
      });
    }
  };

  const handleReassign = async (newPatientId, deviceId) => {
    if (newPatientId) {
      await update(ref(db, `devices/${deviceId}`), {
        patientId: newPatientId,
      });
      await update(ref(db, `/patients/${newPatientId}`), {
        deviceId: deviceId,
      });
      await update(ref(db, `devices/${deviceId}`), {
        status: "online",
      });
    }
  };

  if (loading) return <p className="text-center mt-5">Loading devices...</p>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center fw-bold">Device Management</h2>
      <Link
        className="btn btn-outline-dark btn-sm px-3 py-2 me-2"
        to="/device-management/device-operations/"
      >
        Device Operations
      </Link>

      {devices.length === 0 ? (
        <div className="alert alert-info text-center">
          No devices found in the system.
        </div>
      ) : (
        <div className="table-responsive mt-2">
          <table className="table table-hover table-bordered align-middle">
            <thead className="table-dark">
              <tr>
                <th>Device ID</th>
                <th>Patient ID</th>
                <th>Firmware</th>
                <th>Battery %</th>
                <th>Status</th>
                <th>Last Seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id}>
                  <td className="fw-semibold">{device.id}</td>
                  <td>
                    {device.patientId !== -1 ? device.patientId : "Unassigned"}
                  </td>
                  <td>{device.firmwareVersion || "N/A"}</td>
                  <td>{device.batteryPercent || "—"}</td>
                  <td>
                    <span
                      className={`badge ${
                        device.status === "active"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {device.status || "unknown"}
                    </span>
                  </td>
                  <td>{device.lastSeen || "N/A"}</td>
                  <td>
                    {device.patientId == -1 ? (
                      <button
                        className="btn btn-sm btn-warning m-1"
                        onClick={() => {
                          setSelectedDevice(device.id);
                        }}
                      >
                        Assign
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeactivate(device.id)}
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Patient Selection Modal */}
          {selectedDevice && (
            <div
              className="modal show d-block"
              tabIndex="-1"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      Assign Device: {selectedDevice}
                    </h5>
                    <button
                      className="btn-close"
                      onClick={() => setSelectedDevice(null)}
                    ></button>
                  </div>

                  <div className="modal-body">
                    {freePatients.length === 0 ? (
                      <p className="text-danger">No free patients available!</p>
                    ) : (
                      <ul className="list-group">
                        {freePatients.map((p) => (
                          <li
                            key={p.id}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <strong>{p.id}</strong> - {p.name} <br />
                              <small>Bed : {p.bedNo}</small>
                            </div>

                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                handleReassign(p.id, selectedDevice);
                                setSelectedDevice(null);
                              }}
                            >
                              Select
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setSelectedDevice(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
