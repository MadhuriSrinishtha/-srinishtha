Sequel.migration do
  change do
    alter_table(:leaves) do
      add_foreign_key :employee_email, :employees, key: :official_email, on_delete: :cascade
    end
  end
end