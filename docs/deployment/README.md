# iDocument Deployment Guide

This section contains comprehensive documentation for deploying iDocument in various environments.

## Contents

- [Prerequisites](./prerequisites.md)
- [Environment Setup](./environment.md)
- [Deployment Options](./options.md)
  - [Vercel Deployment](./vercel.md)
  - [Docker Deployment](./docker.md)
  - [Self-hosted Options](./self-hosted.md)
- [Database Setup](./database.md)
- [Environment Variables](./env-variables.md)
- [CI/CD Pipeline](./ci-cd.md)
- [Monitoring](./monitoring.md)
- [Maintenance](./maintenance.md)

## Deployment Options

iDocument can be deployed in various ways:

1. **Vercel Deployment**: The simplest option for deploying the Next.js application
2. **Docker Deployment**: For containerized deployments
3. **Self-hosted**: Options for more customized setups

## Production Checklist

Before deploying to production, ensure:

- All environment variables are correctly set
- Database migrations are applied
- GitHub OAuth is properly configured
- SSL/TLS certificates are in place
- Monitoring and logging are set up

For detailed instructions, see the specific deployment option guides. 