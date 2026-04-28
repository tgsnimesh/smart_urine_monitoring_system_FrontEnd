## Smart Urine Monitoring System Frontend

A React + Vite frontend for monitoring patient urine output in real time. The application provides role-based access for administrators, doctors, and nurses. It includes dashboards, patient detail views, device management, and alert tracking using Firebase Authentication and Realtime Database.

---

## Badges

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-Build_Tool-purple?logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-Realtime-orange?logo=firebase)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- Role-based authentication (admin, doctor, nurse)
- Dashboard with patient, device, and alert summaries
- Patient detail view with charts, alerts, and date range filtering
- Device management with assignment and deactivation
- Patient management (add patients)
- User management (admin only)
- Responsive interface using Bootstrap

---
<!--
## Screenshots

> Add your screenshots inside `public/screenshots/`

### Dashboard
![Dashboard](public/screenshots/dashboard.png)

### Patient Details
![Patient Details](public/screenshots/patient-details.png)

### Device Management
![Device Management](public/screenshots/device-management.png)

---

## Demo

![Demo](public/screenshots/demo.gif)

---
-->

## Tech Stack

- React 19 with Vite
- Firebase Authentication
- Firebase Realtime Database
- React Router
- Chart.js with react-chartjs-2
- Bootstrap 5

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Create a .env file in the root directory and add your Firebase configuration:
```
VITE_apiKey=YOUR_API_KEY
VITE_authDomain=YOUR_AUTH_DOMAIN
VITE_databaseURL=YOUR_DATABASE_URL
VITE_projectId=YOUR_PROJECT_ID
VITE_storageBucket=YOUR_STORAGE_BUCKET
VITE_appId=YOUR_APP_ID
```

### Run Locally
```
npm run dev
```

``` Open http://localhost:5173 ``` <br>

### Build and Preview
```
npm run build
npm run preview
```
### Lint
```
npm run lint
```

### Login ( please don't over use 🥹)
| Role  | Email                                       | Password |
| ----- | ------------------------------------------- | -------- |
| Admin | `tgsnimesh@gmail.com` | `12345678` |
| Doctor | `anupa@gmail.com` | `12345678` |
| Nurse | `nurse1@gmail.com` | `12345678` |

### Project Structure
```
src/
  components/   # Reusable UI components
  context/      # Authentication context and providers
  firebase/     # Firebase configuration
  pages/        # Route-level pages
  utils/        # Shared utilities

public/         # Static assets
```

### Available Routes
``` / or /dashboard - Dashboard (authenticated users) ``` <br>
``` /patient/:id - Patient details (authenticated users) ``` <br>
``` /device-management - Device management (doctor/admin) ``` <br>
``` /device-management/device-operations - Device operations (admin only) ``` <br>
``` /patient-management - Patient management (doctor/admin) ```<br>
``` /user-management - User management (admin only) ``` <br>

### Contributing

Contributions are welcome. Fork the repository and submit a pull request.

### License

This project is licensed under the MIT License.

### Author
| tgsnimesh | Sachintha Nimesh | 
