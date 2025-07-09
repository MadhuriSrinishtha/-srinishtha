Sequel.migration do
  change do
    create_table(:company_policies) do
      primary_key :id
      String :title, null: false
      String :file_name, null: false
      String :file_path, null: false
      TrueClass :is_hidden, default: false
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
    end
  end
end
