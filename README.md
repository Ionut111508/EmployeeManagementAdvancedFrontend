# EmployeeManagementAdvancedFrontend

Frontend React pentru aplicația de management al proiectelor, angajaților, task-urilor, alocărilor și pontajului.

## Stack tehnologic

- React
- TypeScript
- Vite
- React Router
- Axios
- CSS custom

## Backend API

Implicit, aplicația consumă backend-ul ASP.NET Core de la:

```text
http://localhost:5000/api
```

Poți modifica adresa în fișierul `.env`:

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

## Funcționalități planificate

- Dashboard cu KPI-uri operaționale
- Management proiecte și detalii proiect
- Management angajați și resurse umane
- Task-uri, alocări și pontaj
- Gantt simplu pe baza alocărilor
- UI pregătit pentru roluri: Admin, Manager, Angajat

## Pornire locală

```bash
npm install
npm run dev
```
