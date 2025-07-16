require 'sequel'
require 'mail'

begin
  database_config = ENV['DATABASE_URL'] || Psych.load_file(File.expand_path('config/database.yml', __dir__))['development']
  DB = Sequel.connect(database_config)
rescue => e
  abort "Database error: #{e.message}"
end

smtp_config = DB[:smtp_settings].where(environment: ENV['APP_ENV']).first

Mail.defaults do
  delivery_method :smtp, {
    address:        smtp_config[:address],
    port:           smtp_config[:port],
    domain:         smtp_config[:domain],
    user_name:      smtp_config[:user_name],
    password:       smtp_config[:password],
    authentication: smtp_config[:auth_method].to_sym,
    ssl:            smtp_config[:ssl]
  }
end