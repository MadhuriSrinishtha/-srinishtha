Sequel.migration do
  change do
    create_table(:messages) do
      primary_key :id
      String :content
      DateTime :created_at
    end
  end
end
