# Gym Tracker

A self-hosted Progressive Web App (PWA) for tracking gym workouts.

Built with Go, Vanilla JavaScript, and Docker, this project focuses on delivering a simple application backed by production-ready infrastructure and DevOps practices.

---

## Key Highlights

- Full-stack application (Go, Vanilla JS, MariaDB)
- Containerized architecture using Docker
- Automated CI/CD pipeline with GitHub Actions
- Integrated code quality analysis using SonarQube
- Secure, zero-trust deployment via Tailscale VPN
- Full observability stack (Prometheus, Grafana, Loki)
- Real-time deployment notifications via Discord

---

## Architecture Overview

The project is split into two independent environments:

**Application Layer:**
- Backend API (Go)
- Frontend (Nginx + Vanilla JS)
- Database (MariaDB)

**Infrastructure Layer:**
- Monitoring (Prometheus, Grafana)
- Logging (Grafana Alloy, Loki)
- Code Quality (SonarQube, PostgreSQL)

This separation improves scalability, maintainability, and reflects real-world production system design. Additionally, **stateful data is secured using Host Bind Mounts**, ensuring persistence and easy backups across all databases and monitoring states.

---

## CI/CD and Deployment

- Automated build and deployment workflows using GitHub Actions  
- Docker images published to GitHub Container Registry  
- Code quality checks enforced before deployment  
- Secure deployment via private VPN (no public SSH exposure)  
- Post-deployment health checks to verify system stability  

---

## Observability

- Metrics collected with Prometheus  
- Logs dynamically aggregated via Docker Socket using Grafana Alloy and Loki  
- Dashboards managed as code in Grafana  

This setup provides comprehensive visibility across application, container, and host levels.

---

## Purpose of the Project

This project was created to demonstrate:
- practical DevOps and infrastructure skills  
- real-world deployment workflows  
- production-oriented system design  

---

## Future Improvements

- Infrastructure as Code using Terraform  
- Automated server provisioning with Ansible  
- Frontend refactoring and design improvements