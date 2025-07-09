require 'rack/cors'
require 'rack/static'
require_relative './app'

# Enable CORS
use Rack::Cors do
  allow do
    origins '*'
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end

# Serve static files (uploads)
use Rack::Static,
  urls: ["/uploads"],
  root: "public"

# Run the Roda app
run App
