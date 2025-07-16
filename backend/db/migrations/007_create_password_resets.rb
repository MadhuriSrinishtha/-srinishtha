require_relative '../extensions/sequel_extensions'

Sequel.migration do
  change do
    unless table_exists?(:password_resets)
      create_table(:password_resets) do
        primary_key :id
        String :employee_id, size: 50, null: false
        String :reset_token, size: 255, null: false
        column :expires_at, :timestamp, null: false
        column :created_at, :timestamp, null: false

        unique [:reset_token]
        foreign_key [:employee_id], :employees, key: :employee_id, on_delete: :cascade
      end
    end
  end
end
