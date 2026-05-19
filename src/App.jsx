//app.jsx route
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserApp from "./pages/UserApp";
import Dashboard from "./pages/admin/Dashboard";
import Login from "./pages/admin/Login";
import ManageThemes from "./pages/admin/ManageThemes";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserApp />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/themes" element={<ManageThemes />} />
        <Route path="*" element={<div className="p-10 text-center font-bold">Halaman Tidak Ditemukan!</div>} />
      </Routes>
    </Router>
  );
}

export default App;