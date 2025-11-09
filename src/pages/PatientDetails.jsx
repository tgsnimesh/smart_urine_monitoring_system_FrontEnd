// src/pages/PatientDetails.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  ref,
  onValue,
  get,
  query,
  orderByChild,
  startAt,
  endAt,
} from "firebase/database";
import { db } from "../firebase/firebaseConfig";
import ChartComponent from "../components/ChartComponent";
import AlertCard from "../components/AlertCard";
import { formatDate } from "../utils/formatDate";
import "bootstrap/dist/css/bootstrap.min.css";
import { useParams } from "react-router-dom";

// helpers (you can move them to utils/timeUtils.js)
const isoDateOnly = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD
const toISOTime = (d) => d.toISOString();
const pad = (n) => (n < 10 ? "0" + n : "" + n);

function iterateDays(startDate, endDate) {
  const days = [];
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function dateToYMDParts(d) {
  return {
    year: d.getFullYear(),
    month: pad(d.getMonth() + 1),
    day: pad(d.getDate()),
  };
}

// Aggregation helpers
function aggregateSamples(samples, mode = "raw", bucketMinutes = 60) {
  // samples: [{timestamp: ISOstring, flowRate: number}, ...]
  if (!samples || samples.length === 0) return [];

  // convert to ms timestamp
  const arr = samples.map((s) => ({
    t: new Date(s.timestamp).getTime(),
    v: Number(s.flowRate) || 0,
  }));

  if (mode === "raw") {
    // sort and return original order
    arr.sort((a, b) => a.t - b.t);
    return arr.map((x) => ({
      timestamp: new Date(x.t).toISOString(),
      value: x.v,
    }));
  }

  // compute bucket size in ms
  const bucketMs = bucketMinutes * 60 * 1000;

  // find min and max aligned
  let min = Math.min(...arr.map((x) => x.t));
  let max = Math.max(...arr.map((x) => x.t));
  min = Math.floor(min / bucketMs) * bucketMs;

  const buckets = {};
  arr.forEach((p) => {
    const b = Math.floor((p.t - min) / bucketMs);
    if (!buckets[b])
      buckets[b] = { sum: 0, count: 0, start: min + b * bucketMs };
    buckets[b].sum += p.v;
    buckets[b].count += 1;
  });

  // produce continuous buckets from 0 to last
  const nb = Math.floor((max - min) / bucketMs) + 1;
  const result = [];
  for (let i = 0; i < nb; i++) {
    const b = buckets[i];
    const ts = new Date(min + i * bucketMs).toISOString();
    result.push({
      timestamp: ts,
      value: b ? b.sum / b.count : 0, // average in bucket, or 0 when missing
    });
  }
  return result;
}

function movingAverage(data, windowSize = 3) {
  const vals = data.map((d) => d.value);
  const out = data.map((d, i) => {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length - 1, i + Math.floor(windowSize / 2));
    let sum = 0,
      count = 0;
    for (let j = start; j <= end; j++) {
      sum += vals[j];
      count++;
    }
    return { timestamp: data[i].timestamp, value: count ? sum / count : 0 };
  });
  return out;
}

const PatientDetails = () => {
  const { id } = useParams();
  const patientId = id;

  const [patient, setPatient] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState("Unknown");
  const [flowHistoryRaw, setFlowHistoryRaw] = useState([]); // raw samples fetched
  const [loadingHistory, setLoadingHistory] = useState(false);

  // UI state for filtering
  const [rangePreset, setRangePreset] = useState("today"); // today, yesterday, last7, custom
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [aggregationMode, setAggregationMode] = useState("hourly"); // raw, min15, hourly, daily
  const [movingAvg, setMovingAvg] = useState(false);
  const [maWindow, setMaWindow] = useState(3);

  // load patient & alerts
  useEffect(() => {
    const patientRef = ref(db, `patients/${patientId}`);
    const unsub = onValue(patientRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPatient(data);

        const alertsRef = ref(db, `/alerts/${patientId}`);
        onValue(alertsRef, (snapshot) => {
          if (snapshot.exists()) {
            const alertsData = snapshot.val() || {};
            setAlerts(Object.values(alertsData));
          }
        });
      }
    });

    return () => unsub();
  }, [patientId]);

  // device status watch
  useEffect(() => {
    if (!patient || !patient.deviceId) return;
    const deviceRef = ref(db, `devices/${patient.deviceId}`);
    const unsub = onValue(deviceRef, (snapshot) => {
      if (snapshot.exists()) {
        const deviceData = snapshot.val();
        setDeviceStatus(deviceData.status || "offline");
      }
    });
    return () => unsub();
  }, [patient]);

  // inside PatientDetails component, remove fetchHistoryForRange function and onApplyCustomRange's fetch call
  // add this useEffect (placed after your device/patient effects). It listens in realtime.

  useEffect(() => {
    // compute day list from startDate -> endDate (YYYY-MM-DD strings)
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T23:59:59");
    const dayList = iterateDays(start, end);

    // hold unsubscribe functions
    const unsubs = [];
    let isMounted = true;

    // helper to deeply gather samples from snapshot.val()
    const gatherFromNode = (node) => {
      const collected = [];
      const gather = (n) => {
        if (!n || typeof n !== "object") return;
        // check sample format: ts & volume_ml or ts & flowRate (you used volume_ml before)
        if (n.ts && (n.volume_ml !== undefined || n.flowRate !== undefined)) {
          collected.push({
            timestamp: n.ts,
            flowRate: n.volume_ml !== undefined ? n.volume_ml : n.flowRate,
          });
          return;
        }
        Object.values(n).forEach((c) => gather(c));
      };
      gather(node);
      return collected;
    };

    // start fresh
    setLoadingHistory(true);
    setFlowHistoryRaw([]); // optional: clear while loading

    // For each date attach onValue
    dayList.forEach((d) => {
      const { year, month, day } = dateToYMDParts(d);
      const dayRef = ref(db, `history/${patientId}/${year}/${month}/${day}`);

      const off = onValue(
        dayRef,
        (snap) => {
          if (!isMounted) return;
          const val = snap.exists() ? snap.val() : null;
          if (!val) {
            // day cleared: remove samples for this day from state
            setFlowHistoryRaw((prev) =>
              prev.filter((p) => {
                const dt = new Date(p.timestamp);
                return !(
                  dt.getFullYear() === Number(year) &&
                  pad(dt.getMonth() + 1) === month &&
                  pad(dt.getDate()) === day
                );
              })
            );
            return;
          }

          const samples = gatherFromNode(val); // [{timestamp, flowRate}, ...]

          // merge samples into the state, replacing any samples that belong to this day
          setFlowHistoryRaw((prev) => {
            // filter out old samples belonging to this day
            const filtered = prev.filter((p) => {
              const dt = new Date(p.timestamp);
              return !(
                dt.getFullYear() === Number(year) &&
                pad(dt.getMonth() + 1) === month &&
                pad(dt.getDate()) === day
              );
            });
            // add new day's samples then sort
            const merged = filtered.concat(
              samples.map((s) => ({
                timestamp: s.timestamp,
                flowRate: s.flowRate,
              }))
            );
            merged.sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );
            return merged;
          });
        },
        (err) => {
          console.error("onValue error for day", year, month, day, err);
        }
      );

      // store unsubscribe function returned by onValue (it returns the 'off' function)
      unsubs.push(() => off());
    });

    // finished initial subscription
    setLoadingHistory(false);

    return () => {
      isMounted = false;
      // cleanup all listeners
      unsubs.forEach((u) => {
        try {
          u();
        } catch (e) {}
      });
    };
  }, [patientId, startDate, endDate]); // re-run when user changes the range or patient changes

  // update onApplyCustomRange to only set rangePreset -> the effect above will fire
  const onApplyCustomRange = () => {
    setRangePreset("custom");
    // no direct fetch() here; effect watches startDate/endDate and will subscribe
  };

  // Apply preset quickly (today, yesterday, last7)
  useEffect(() => {
    const now = new Date();
    let s, e;
    if (rangePreset === "today") {
      s = new Date(now);
      e = new Date(now);
    } else if (rangePreset === "yesterday") {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      s = new Date(y);
      e = new Date(y);
    } else if (rangePreset === "last7") {
      const sD = new Date(now);
      sD.setDate(now.getDate() - 6); // last 7 days inclusive
      s = sD;
      e = new Date(now);
    } else {
      // custom - use current values
      s = new Date(startDate + "T00:00:00");
      e = new Date(endDate + "T00:00:00");
    }
    // set input values
    setStartDate(s.toISOString().slice(0, 10));
    setEndDate(e.toISOString().slice(0, 10));
  }, [rangePreset, patientId]); // run when preset or patient changes

  // ---- derived/aggregated data for chart ----
  const aggregated = useMemo(() => {
    let mode = "raw";
    let bucketMinutes = 1;
    if (aggregationMode === "raw") {
      mode = "raw";
      bucketMinutes = 1;
    } else if (aggregationMode === "min15") {
      mode = "bucket";
      bucketMinutes = 15;
    } else if (aggregationMode === "hourly") {
      mode = "bucket";
      bucketMinutes = 60;
    } else if (aggregationMode === "daily") {
      mode = "bucket";
      bucketMinutes = 60 * 24;
    }

    const agg = aggregateSamples(
      flowHistoryRaw,
      mode === "raw" ? "raw" : "bucket",
      bucketMinutes
    );

    const final = movingAvg ? movingAverage(agg, Number(maWindow || 3)) : agg;

    // produce labels & datapoints
    const labels = final.map((d) => {
      const dt = new Date(d.timestamp);
      // friendly label
      if (aggregationMode === "daily") return dt.toLocaleDateString();
      if (aggregationMode === "hourly")
        return (
          dt.toLocaleString([], { hour: "2-digit", hour12: false }) +
          " : " +
          dt.toLocaleDateString()
        );
      if (aggregationMode === "min15") return dt.toLocaleString();
      return dt.toLocaleTimeString();
    });
    const dataPoints = final.map((d) => d.value);

    // keep raw array for CSV export
    return { labels, dataPoints, points: final };
  }, [flowHistoryRaw, aggregationMode, movingAvg, maWindow]);

  // CSV export
  const exportCSV = () => {
    const rows = [["timestamp", "value"]];
    aggregated.points.forEach((p) => rows.push([p.timestamp, p.value]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${patientId}_flow_${startDate}_to_${endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!patient) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Patient Details: {patient.name}</h3>

      {/* Basic Info */}
      <div className="card p-3 mb-4 shadow-sm">
        <h5>Patient Info</h5>
        <p>
          <strong>Bed No:</strong> {patient.bedNo}
        </p>
        <p>
          <strong>Ward:</strong> {patient.ward}
        </p>
        <p>
          <strong>Gender:</strong> {patient.gender === "M" ? "Male" : "Female"}
        </p>
        <p>
          <strong>DOB:</strong> {patient.dob}
        </p>
      </div>

      {/* Device Info */}
      <div className="card p-3 mb-4 shadow-sm">
        <h5>Device Info</h5>
        <p>
          <strong>Device ID:</strong> {patient.deviceId}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span
            className={
              deviceStatus === "online" ? "text-success" : "text-danger"
            }
          >
            {deviceStatus}
          </span>
        </p>
      </div>

      {/* Filtering Controls */}
      <div className="card p-3 mb-4 shadow-sm">
        <h5>Data Filters</h5>

        <div className="mb-2">
          <label className="me-2">Preset:</label>
          <select
            value={rangePreset}
            onChange={(e) => setRangePreset(e.target.value)}
            className="form-select form-select-sm w-auto d-inline-block"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 days</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="mb-2 d-flex gap-2 align-items-center">
          <label>Start</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="form-control form-control-sm w-auto"
          />
          <label>End</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="form-control form-control-sm w-auto"
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={onApplyCustomRange}
          >
            Apply
          </button>
        </div>

        <div className="mb-2 d-flex gap-2 align-items-center">
          <label>Aggregation</label>
          <select
            value={aggregationMode}
            onChange={(e) => setAggregationMode(e.target.value)}
            className="form-select form-select-sm w-auto"
          >
            <option value="raw">Raw samples</option>
            <option value="min15">15 minutes</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
          </select>

          <label className="ms-3">Smoothing</label>
          <input
            type="checkbox"
            checked={movingAvg}
            onChange={(e) => setMovingAvg(e.target.checked)}
          />
          {movingAvg && (
            <>
              <label className="ms-2">Window</label>
              <input
                type="number"
                min="1"
                step="1"
                value={maWindow}
                onChange={(e) => setMaWindow(e.target.value)}
                className="form-control form-control-sm w-auto"
              />
            </>
          )}

          <button
            className="btn btn-outline-secondary btn-sm ms-3"
            onClick={exportCSV}
          >
            Export CSV
          </button>
        </div>

        <div>
          <small className="text-muted">
            Fetched points: {flowHistoryRaw.length} • Aggregated points:{" "}
            {aggregated.points.length} {loadingHistory && "(loading...)"}
          </small>
        </div>
      </div>

      {/* Chart */}
      <ChartComponent
        labels={aggregated.labels}
        dataPoints={aggregated.dataPoints}
      />

      {/* Alert History */}
      <div className="card p-3 mt-4 shadow-sm">
        <h5 className="mb-3">Alert History</h5>
        {alerts.length > 0 ? (
          alerts.map((alert, index) => <AlertCard key={index} alert={alert} />)
        ) : (
          <p className="text-muted">No alerts recorded.</p>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;
