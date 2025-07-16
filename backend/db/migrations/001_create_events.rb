require_relative '../extensions/sequel_extensions'

Sequel.migration do
  change do
    unless table_exists?(:events)
      create_table(:events) do
        primary_key :id
        column :title, Text
        column :date, Date
        column :added_at, DateTime
      end
    end
  end
end
