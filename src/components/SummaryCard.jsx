// src/components/SummaryCard.jsx
import React from "react";

const SummaryCard = ({ title, value }) => {
  return (
    <div className="card text-center shadow-sm mb-3">
      <div className="card-body">
        <h6 className="card-title">{title}</h6>
        <h3 className="card-text">{value}</h3>
      </div>
    </div>
  );
};

export default SummaryCard;
