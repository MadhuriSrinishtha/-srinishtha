require_relative '../extensions/sequel_extensions'

Sequel.migration do
  change do
    unless table_exists?(:leaves)
      create_table(:leaves) do
        primary_key :id
        column :employee_email, :text
        column :employee_name, :text
        column :leave_type, :text
        column :start_date, :date
        column :end_date, :date
        column :day_type, :text
        column :reason, :text
        column :duration, :float
        column :status, :text, default: 'Submitted'
        column :created_at, :timestamp
        column :submitted_at, :timestamp
        column :updated_at, :timestamp
        String :employee_id, size: 50
      end
    end
  end
end
