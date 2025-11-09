import { useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getAuth, signOut } from "firebase/auth";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Navbar() {
  const { user, role, login, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 py-3">
      {/* Logo */}
      <Link className="navbar-brand fw-bold" to="/dashboard">
        Smart Urine System
      </Link>

      {/* Mobile toggle */}
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        {/* Left menu */}
        <ul className="navbar-nav me-auto">
          {/* Dashboard */}
          <li className="nav-item">
            <NavLink className="nav-link" to="/dashboard">
              Dashboard
            </NavLink>
          </li>

          {/* Device Management (Admins & Doctors only) */}
          {(role === "doctor" || role === "admin") && (
            <li className="nav-item">
              <NavLink className="nav-link" to="/device-management">
                Devices
              </NavLink>
            </li>
          )}

          {/* User Management (Admin only) */}
          {role === "admin" && (
            <li className="nav-item">
              <NavLink className="nav-link" to="/user-management">
                Users
              </NavLink>
            </li>
          )}

          {/* Patient Management (Admins & Doctors only) */}
          {(role === "doctor" || role === "admin") && (
            <li className="nav-item">
              <NavLink className="nav-link" to="/patient-management">
                Patients
              </NavLink>
            </li>
          )}
        </ul>

        {/* Right side user info */}
        <div className="d-flex align-items-center text-light">
          <span className="me-3 fw-semibold">
            {user?.name || user?.email} | {role?.toUpperCase()}
          </span>

          <button
            className="btn btn-sm btn-outline-light"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
