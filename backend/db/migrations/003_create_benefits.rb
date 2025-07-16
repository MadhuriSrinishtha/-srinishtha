require_relative '../extensions/sequel_extensions'

Sequel.migration do
  change do
    unless table_exists?(:benefits)
      create_table(:benefits) do
        primary_key :id
        column :type, :text, null: false
        column :file_name, :text, null: false
        column :file_path, :text, null: false
        column :created_at, :timestamp, null: false, default: Sequel.lit('CURRENT_TIMESTAMP')
        String :employee_id, size: 50
      end
    end
  end
end
