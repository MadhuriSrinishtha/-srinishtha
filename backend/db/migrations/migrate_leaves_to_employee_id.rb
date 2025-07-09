require 'sequel'

DB = Sequel.connect(ENV['DATABASE_URL'] || YAML.load_file('config/database.yml')['development'])

DB.create_table?(:leaves_temp) do
  primary_key :id
  String :employee_id, null: false
  String :leave_type, null: false
  String :day_type, null: false
  String :reason, null: false
  Date :start_date, null: false
  Date :end_date, null: false
  Integer :duration, null: false
  String :status, null: false
  DateTime :submitted_at, null: false
  DateTime :created_at, null: false
  DateTime :updated_at, null: false
  foreign_key :employee_id, :employees, key: :employee_id, on_delete: :restrict
end

DB[:leaves].each do |leave|
  employee = DB[:employees].where(official_email: leave[:employee_email]).first
  if employee
    DB[:leaves_temp].insert(
      id: leave[:id],
      employee_id: employee[:employee_id],
      leave_type: leave[:leave_type],
      day_type: leave[:day_type],
      reason: leave[:reason],
      start_date: leave[:start_date],
      end_date: leave[:end_date],
      duration: leave[:duration],
      status: leave[:status],
      submitted_at: leave[:submitted_at],
      created_at: leave[:created_at],
      updated_at: leave[:updated_at]
    )
  else
    puts "Warning: No employee found for email #{leave[:employee_email]} in leave ID #{leave[:id]}"
  end
end

DB.drop_table(:leaves)
DB.rename_table(:leaves_temp, :leaves)