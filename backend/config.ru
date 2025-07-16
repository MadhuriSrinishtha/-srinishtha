require 'rack/cors'
require 'rack/static'
require 'rack/session/cookie'
require_relative './app'

# CORS setup to allow frontend to make requests with cookies
use Rack::Cors do
  allow do
    origins ENV['FRONTEND_URL'] || 'http://localhost:5173' # frontend dev server
    resource '/api/*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end

# ✅ Session middleware (must be BEFORE run App)
use Rack::Session::Cookie,
  key: 'rack.session',
  path: '/',
  same_site: :lax,         # Can also use :strict or :none
  secure: false,           # true in production with HTTPS
  http_only: true,
  secret: ENV['SESSION_SECRET'] || 'this_is_a_temporary_dev_secret_but_should_be_64_bytes_or_more_for_production_1234567890'

# Serve static files (e.g., /uploads)
use Rack::Static,
  urls: ["/uploads"],
  root: "public"

# Run your Roda application
run App
