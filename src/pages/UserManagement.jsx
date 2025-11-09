import React, { useEffect, useState } from "react";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";
import {
  getAuth,
  createUserWithEmailAndPassword,
  deleteUser,
} from "firebase/auth";

const UserManagement = () => {
  const db = getDatabase();
  const auth = getAuth();

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "doctor",
  });

  useEffect(() => {
    const usersRef = ref(db, "users/");
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.values(data);
        setUsers(arr);
      } else {
        setUsers([]);
      }
    });
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password)
      return alert("Email & Password required");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const newUser = userCredential.user;

      const userData = {
        uid: newUser.uid,
        name: form.name,
        email: form.email,
        role: form.role,
        createdAt: new Date().toISOString(),
      };

      await set(ref(db, `users/${newUser.uid}`), userData);

      alert("User created successfully!");
      setForm({ name: "", email: "", password: "", role: "doctor" });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteUser = async (uid) => {
    if (!window.confirm("Are you sure to delete this user?")) return;

    try {
      // Admin cannot delete Auth user directly here if not logged as that user
      // Normally admin deletes via Firebase Admin SDK (server)
      // remove record in database only
      await remove(ref(db, `users/${uid}`));

      alert("User removed from system (Auth removal recommended in Admin SDK)");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="container mt-4">
      <h2>User Management</h2>

      <div className="card p-3 mb-4">
        <h5>Create New User</h5>
        <form onSubmit={handleCreateUser}>
          <div className="mb-2">
            <label>Name</label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="mb-2">
            <label>Email</label>
            <input
              className="form-control"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="mb-2">
            <label>Password</label>
            <input
              className="form-control"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="mb-2">
            <label>Role</label>
            <select
              className="form-control"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
            </select>
          </div>

          <button className="btn btn-primary mt-2" type="submit">
            Create User
          </button>
        </form>
      </div>

      <h5>Registered Users</h5>
      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.length ? (
            users.map((u) => (
              <tr key={u.uid}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{new Date(u.createdAt).toLocaleString()}</td>
                <td>
                  {u.role !== "admin" && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteUser(u.uid)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
