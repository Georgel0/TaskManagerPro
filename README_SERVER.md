The Self-Hosting Survival Guide
1. App Management (PM2)
ssh -i 'ssh-key-2026-04-28.key' ubuntu@144.24.185.246

See what's running: pm2 status

View real-time logs: pm2 logs (Use Ctrl+C to exit)

Restart the app (after code updates): pm2 restart all

Stop the app: pm2 stop all

CRITICAL: If you add a new environment variable or change your app's name, run pm2 save after restarting to "freeze" the new state.

2. The Web Server (Nginx)
Check for syntax errors: sudo nginx -t (Do this EVERY time you touch a config file!)

Apply config changes: sudo systemctl restart nginx

See who is visiting (Access Logs): tail -f /var/log/nginx/access.log

See why things are failing (Error Logs): tail -f /var/log/nginx/error.log

3. The Database (PostgreSQL)
Enter the DB console: psql -h localhost -U task_user -d task_manager

Back up your database to a file: pg_dump -h localhost -U task_user -d task_manager > backup_$(date +%F).sql

List all tables (inside psql): \dt

Exit psql: \q

4. Security & SSL (Certbot)
Check SSL certificate status: sudo certbot certificates

Test the auto-renewal (Dry Run): sudo certbot renew --dry-run

Note: Certbot usually handles this automatically in the background.

5. Deployment Workflow (Updating your code)
When you push new code to GitHub and want it live on your server:

cd ~/TaskManagerPro

git pull origin main

cd server (if your changes were in the backend)

npm install (if you added new packages)

pm2 restart all

6. System Health
Check Disk Space: df -h (Oracle's free tier gives you a lot, but it's good to check).

Check RAM usage: free -m

Check Firewall rules: sudo iptables -L INPUT --line-numbers
