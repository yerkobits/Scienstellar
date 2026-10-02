module.exports = {
  apps: [
    {
      name: 'scienstellar-frontend',
      script: 'npm',
      args: 'run preview',
      env: {
        PORT: 1337,
        NODE_ENV: 'production'
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000
    }
  ]
};
