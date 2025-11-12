import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { go, graph, pass } from "../assets";

const Button = () => {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const ADMIN_PASSWORD = "admin"; // Your constant password

  const handleClick = () => {
    setShowPasswordModal(true);
    setPassword("");
    setError("");
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setShowPasswordModal(false);
      navigate("/pages");
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  const handleModalClose = () => {
    setShowPasswordModal(false);
    setPassword("");
    setError("");
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="w-[40vw] rounded-[14px] bluish py-4 px-10 shadow-2xl xl:max-w-sm
                   cursor-pointer transform hover:scale-105 transition-all hover:!bg-purple-800"
      >
        <div className="flex flex-row gap-5 mx-auto">
          <h1 className="p-2 text-white aeon-bold">Get Started With Us</h1>
          <div className="bg-white w-8 h-8 mt-1 rounded-full">
            <img src={go} className="p-2" />
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[14px] p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl aeon-bold mb-4 flex flex-row text-gray-800">
              <span className=" w-8 h-8 border border-purple-300 bg-purple-100 rounded-full mr-2">
                <img src={pass} alt=""  className="p-2"/></span>
              Admin Access Required
            </h2>
            <p className="text-gray-600 inter mb-6">
              Please enter the password to continue
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 inter border border-gray-300 rounded-[14px] mb-4 focus:outline-none focus:ring-1 focus:ring-purple-600"
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1  text-white py-3 rounded-[14px] bluish transform hover:scale-105
                   transition-all cursor-pointer inter  hover:!bg-purple-800 intermid"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="flex-1 bg-gray-200 inter text-gray-700 py-3 rounded-[14px] hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Button;