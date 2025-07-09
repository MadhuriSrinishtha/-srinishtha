Sequel.migration do
  change do
    alter_table(:employees) do
      set_column_not_null :id unless column_not_null?(:id) # Use :id instead of :employee_id since it’s the primary key
    end
  end
end