Sequel.migration do
  change do
    alter_table(:employees) do
      add_column :photo, String unless column_exists?(:photo)
    end
  end
end