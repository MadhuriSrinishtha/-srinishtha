require 'sequel'

# Connect to your local SQLite database
DB = Sequel.connect('sqlite://db/development.sqlite3')

# Create the benefits table if it doesn't exist
DB.create_table?(:benefits) do
  primary_key :id
  String :type, null: false
  String :file_name, null: false
  String :file_path, null: false
  DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
end

puts "✅ Benefits table created successfully"
