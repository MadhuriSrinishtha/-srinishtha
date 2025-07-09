# db/migrations/xxxx_create_messages.rb
Sequel.migration do
  change do
    create_table(:messages) do
      primary_key :id
      String :content
    end
  end
end
