require_relative '../extensions/sequel_extensions'

Sequel.migration do
  change do
    unless table_exists?(:employees)
      create_table(:employees) do
        String :employee_id, size: 50, primary_key: true
        String :official_email, size: 255, null: false
        String :personal_email, size: 255, null: false
        String :first_name, size: 100, null: false
        String :last_name, size: 100, null: false
        String :middle_name, size: 100
        String :gender, size: 50
        String :blood_group, size: 10
        Date :date_of_birth, null: false
        String :mobile, size: 20, null: false
        String :alternate_contact, size: 20
        String :emergency_contact_number, size: 20
        Text :present_address
        Text :permanent_address
        String :qualification, size: 100, null: false
        String :department, size: 100, null: false
        String :designation, size: 100, null: false
        String :reporting_manager, size: 100
        String :employment_type, size: 50, null: false
        String :work_shift, size: 50
        Date :confirmation_date
        Date :relieving_date
        Date :date_of_joining, null: false
        String :employee_status, size: 50, null: false
        column :created_at, :timestamp, null: false
        column :updated_at, :timestamp, null: false
        String :password, size: 255

        unique [:employee_id]
        unique [:official_email]
      end
    end
  end
end
