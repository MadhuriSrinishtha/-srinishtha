require 'sequel'
require 'bcrypt'

DB = Sequel.connect(ENV['DATABASE_URL'] || YAML.load_file('config/database.yml')['development'])

Sequel.migration do
  up do
    default_password = BCrypt::Password.create('user@123')
    DB[:employees].where(password: nil).update(password: default_password)
  end

  down do
    # No-op for rollback
  end
end