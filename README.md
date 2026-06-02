# EmployeeManagementAdvancedFrontend

React frontend for the Employee Management advanced project suite.

## Stack

- React
- TypeScript
- Vite
- React Router
- Axios
- Custom CSS

## Backend API

By default, the app uses the ASP.NET Core backend at:

```text
http://localhost:5000/api
```

You can override it in `.env`:

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

## Main Features

- Login/logout with persisted local session
- Role-aware navigation for Admin, Manager, and Employee users
- Scoped dashboards, projects, tasks, employees, allocations, and timesheets
- Employee role overview
- Allocation availability and simulation before creating assignments
- Employee leaves, skills, departments, and project details
- Gantt-style allocation view

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
