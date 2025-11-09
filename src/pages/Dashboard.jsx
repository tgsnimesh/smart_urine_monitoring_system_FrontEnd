// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase/firebaseConfig";
import SummaryCard from "../components/SummaryCard";
import PatientTable from "../components/PatientTable";

const Dashboard = () => {
  const [patients, setPatients] = useState([]);
  const [devices, setDevices] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const patientsRef = ref(db, "patients");
    onValue(patientsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setPatients(Object.values(data));
    });

    const devicesRef = ref(db, "devices");
    onValue(devicesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setDevices(Object.values(data));
    });

    const alertsRef = ref(db, "alerts");

    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val() || {};
      let totalUnread = 0;

      // Loop through each patient
      Object.values(data).forEach((patientAlerts) => {
        // Loop through each alert under this patient
        Object.values(patientAlerts).forEach((alert) => {
          if (alert.status === "unread") {
            totalUnread++;
          }
        });
      });

      setUnreadCount(totalUnread);
    });
  }, []);

  const totalPatients = patients.length;
  const onlineDevices = devices.filter((p) => p.status === "online").length;
  const patientsAtRisk = patients.filter(
    (p) => p.urineData?.fillPercentage >= 75
  ).length;

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Dashboard</h3>
      <div className="row">
        <div className="col-md-3">
          <SummaryCard title="Total Patients" value={totalPatients} />
        </div>
        <div className="col-md-3">
          <SummaryCard title="Active Alerts" value={unreadCount} />
        </div>
        <div className="col-md-3">
          <SummaryCard title="Devices Online" value={onlineDevices} />
        </div>
        <div className="col-md-3">
          <SummaryCard title="Patients at Risk" value={patientsAtRisk} />
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <PatientTable patients={patients} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
