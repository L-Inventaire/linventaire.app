# 📒 linventaire.app

> *The ERP co-pilot for your business — Agile. Flexible. Fast.*

![linventaire.app screenshot](./screenshot.png)

![Tests](https://img.shields.io/github/actions/workflow/status/L-Inventaire/linventaire.app/deploy-docker.yml?branch=main)
![Docker Deploy](https://img.shields.io/github/actions/workflow/status/L-Inventaire/linventaire.app/deploy-docker.yml?branch=main)
![GitHub last commit](https://img.shields.io/github/last-commit/L-Inventaire/linventaire.app)
![GitHub repo size](https://img.shields.io/github/repo-size/L-Inventaire/linventaire.app)
![License](https://img.shields.io/github/license/L-Inventaire/linventaire.app)

---

## ✨ Features

✅ Invoice & Quote management  
✅ Recurring invoices  
✅ Supplier orders and invoices  
✅ CRM and contact management  
✅ Inventory tracking  
✅ User‑friendly web interface  
✅ Deployable with Docker  
✅ Powerful and simple stack (Node+Postgres)  
✅ Open‑source  

---

## 🧰 Project Structure

- **frontend/**  
  React + TypeScript web application  
  ([frontend/README.md](frontend/README.md))

- **backend/**  
  Node.js + TypeScript  
  ([backend/README.md](backend/README.md))

---

## 🚀 Quick Start (with Docker Compose)

You can launch the full application (frontend + backend + database) using Docker Compose for development and testing.

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed
- [Docker Compose](https://docs.docker.com/compose/) installed

### Run

```bash
git clone https://github.com/L-Inventaire/linventaire.app.git
cd linventaire.app
docker-compose up --build
```