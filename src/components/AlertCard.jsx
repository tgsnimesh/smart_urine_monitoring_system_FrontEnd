import React from "react";
import { getAlertColor } from "../utils/alertColors";
import "./AlertCard.css"; // we'll create this file next

const AlertCard = ({ alert }) => {
  const color = getAlertColor(alert.severity);
  const formattedTime = new Date(alert.createdAt).toLocaleString();

  return (
    <div className="alert-card" style={{ borderLeft: `6px solid ${color}` }}>
      <div className="alert-header">
        <span className="alert-type">{alert.type.replace(/_/g, " ")}</span>
        <span
          className={`alert-status ${
            alert.status === "unread" ? "unread" : "read"
          }`}
        >
          {alert.status.toUpperCase()}
        </span>
      </div>

      <div className="alert-message">{alert.message}</div>

      <div className="alert-details">
        <div>
          <strong>Device ID:</strong> {alert.deviceId}
        </div>
        <div>
          <strong>Patient ID:</strong> {alert.patientId}
        </div>
        <div>
          <strong>Severity:</strong>{" "}
          <span className={`alert-severity ${alert.severity.toLowerCase()}`}>
            {alert.severity}
          </span>
        </div>
        <div>
          <strong>Created At:</strong> {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
