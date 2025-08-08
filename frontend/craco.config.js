module.exports = {
  style: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
  devServer: {
    host: '0.0.0.0',
    port: 3100,
    allowedHosts: 'all',
  },
}