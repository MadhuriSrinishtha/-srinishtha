Sequel.migration do
  change do
    alter_table(:employees) do
      set_column_not_null :employee_id
      add_index :employee_id, unique: true

    end
  end
end