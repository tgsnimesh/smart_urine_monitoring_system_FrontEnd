// src/components/ChartComponent.jsx
import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

const ChartComponent = ({ labels = [], dataPoints = [] }) => {
  const data = {
    labels,
    datasets: [
      {
        label: "Volume (ml/min)",
        data: dataPoints,
        borderColor: "#007bff",
        tension: 0.2,
        fill: false,
        pointRadius: 1.5,
      },
      // optional threshold dataset (example)
      // {
      //   label: 'Warning threshold',
      //   data: new Array(dataPoints.length).fill(200), // fill with threshold value
      //   borderDash: [6, 6],
      //   borderColor: 'rgba(255,99,132,0.6)',
      //   pointRadius: 0,
      //   fill: false,
      //   yAxisID: 'y',
      // }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            const v = context.parsed.y;
            return `${context.dataset.label}: ${Number(v).toFixed(2)} ml/min`;
          },
        },
      },
      // you can add zoom plugin config here if installed
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: { display: true, text: "Time" },
      },
      y: {
        display: true,
        title: { display: true, text: "ml/min" },
      },
    },
  };

  return (
    <div style={{ height: 340 }} className="card p-3 mb-4 shadow-sm">
      <Line data={data} options={options} />
    </div>
  );
};

export default ChartComponent;
