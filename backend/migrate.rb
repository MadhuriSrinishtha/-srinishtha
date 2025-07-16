require 'sequel'
require 'yaml'
require_relative 'db/extensions/sequel_extensions'

env = ENV['RACK_ENV'] || 'development'
db_config = YAML.load_file('config/database.yml')[env]

# PostgreSQL connection string
db_url = "postgres://#{db_config['user']}:#{db_config['password']}@#{db_config['host']}/#{db_config['database']}"
DB = Sequel.connect(db_url)

Sequel.extension :migration
Sequel::Migrator.run(DB, 'db/migrations')

puts "✅ Migrations ran successfully!"