require_relative '../extensions/sequel_extensions'

Sequel.migration do
  change do
    unless table_exists?(:announcements)
      create_table(:announcements) do
        primary_key :id
        column :title, :text, null: false
        column :description, :text, null: false
        column :created_at, :timestamp, null: false, default: Sequel.lit('now()')
      end
    end
  end
end
