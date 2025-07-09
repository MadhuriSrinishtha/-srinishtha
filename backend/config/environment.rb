# config/environment.rb
require "bundler/setup"
require "roda"
require "sequel"
require "dotenv/load"

DB = Sequel.connect(ENV["DATABASE_URL"])
