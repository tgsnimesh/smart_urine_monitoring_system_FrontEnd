import React from "react";
import { Link } from "react-router-dom";

export default function NotAuthorized() {
  return (
    <>
      <div className="container mt-5 text-center not-authorized-container">
        <h2 className="text-danger fw-bold mb-3">Access Denied</h2>
        <p className="text-muted mb-4">
          You do not have permission to view this page.
        </p>
        <Link className="btn-sm" to="/">
          <div className="image-wrapper">
            <img
              src="/img/access-denied.jpg"
              alt="Access Denied"
              className="access-denied-image"
            />
          </div>
        </Link>
      </div>

      <style>{`
        .not-authorized-container {
          animation: fadeIn 0.8s ease-in-out;
        }

        .image-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .access-denied-image {
          width: 400px;
          max-width: 80%;
          opacity: 0;
          transform: scale(0.95);
          animation: fadeZoomIn 1s ease-in-out 0.3s forwards;
          border-radius: 10px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeZoomIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
