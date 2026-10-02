module.exports = {
  apps: [
    {
      name: 'scienstellar-frontend',
      cwd: '/root/Scienstellar/frontend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development'
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000
    }
  ]
};
