require_relative '../extensions/sequel_extensions'

Sequel.migration do
  change do
    unless table_exists?(:company_policies)
      create_table(:company_policies) do
        primary_key :id
        column :title, :text, null: false
        column :file_name, :text, null: false
        column :file_path, :text, null: false
        column :is_hidden, :boolean, null: false, default: false
        column :created_at, :timestamp, null: false, default: Sequel.lit('CURRENT_TIMESTAMP')
      end
    end
  end
end
