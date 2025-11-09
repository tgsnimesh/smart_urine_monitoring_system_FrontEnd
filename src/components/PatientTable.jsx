// src/components/PatientTable.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./AlertCard.css";

const PatientTable = ({ patients }) => {
  return (
    <table className="table table-striped table-hover shadow-sm">
      <thead className="table-dark">
        <tr>
          <th>Name</th>
          <th>Bed No</th>
          <th>Ward</th>
          <th>Current Volume (ml)</th>
          <th>Fill %</th>
          <th>Status</th>
          <th>Alert Level</th>
        </tr>
      </thead>
      <tbody>
        {patients.map((p) => (
          <tr key={p.patientId}>
            <td>
              <Link to={`/patient/${p.patientId}`}>{p.name}</Link>
            </td>
            <td>{p.bedNo}</td>
            <td>{p.ward}</td>
            <td>{p.urineData?.currentVolume_ml || "-"}</td>
            <td>{p.urineData?.fillPercentage || "-"}</td>
            <td>{p.urineData?.status || "-"}</td>
            <td>
              <span
                className={`alert-severity ${p.urineData.alertLevel.toLowerCase()} text-center p-2`}
              >
                {p.urineData.alertLevel}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PatientTable;
