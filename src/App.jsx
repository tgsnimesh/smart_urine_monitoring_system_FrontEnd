import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import PatientDetails from "./pages/PatientDetails";
import Login from "./pages/Login";
import DeviceManagement from "./pages/DeviceManagement";
import UserManagement from "./pages/UserManagement";
import NotAuthorized from "./pages/NotAuthorized";
import AddPatient from "./pages/AddPatient";
import DeviceOperations from "./pages/DeviceOperations";

import {
  PrivateRoute,
  AdminRoute,
  DoctorRoute,
} from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route
            path="/patient/:id"
            element={
              <PrivateRoute>
                <PatientDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/device-management/"
            element={
              <DoctorRoute>
                <DeviceManagement />
              </DoctorRoute>
            }
          />
          <Route
            path="device-management/device-operations/"
            element={
              <AdminRoute>
                <DeviceOperations />
              </AdminRoute>
            }
          />
          <Route
            path="/user-management/"
            element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/patient-management/"
            element={
              <DoctorRoute>
                <AddPatient />
              </DoctorRoute>
            }
          />
          <Route path="/not-authorized" element={<NotAuthorized />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
