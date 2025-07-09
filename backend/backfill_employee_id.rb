require 'sequel'

DB = Sequel.connect(ENV['DATABASE_URL'] || YAML.load_file('config/database.yml')['development'])

DB[:employees].where(employee_id: nil).each do |employee|
  random_num = rand(1000..9999)
  employee_id = "EMP-#{random_num}"
  while DB[:employees].where(employee_id: employee_id).first
    random_num = rand(1000..9999)
    employee_id = "EMP-#{random_num}"
  end
  DB[:employees].where(id: employee[:id]).update(employee_id: employee_id)
  puts "Updated employee ID #{employee[:id]} with employee_id #{employee_id}"
end