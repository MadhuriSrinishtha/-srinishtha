require_relative '../extensions/sequel_extensions'

Sequel.migration do
  change do
    unless table_exists?(:smtp_settings)
      create_table(:smtp_settings) do
        primary_key :id
        column :address, :text
        column :port, :integer
        column :domain, :text
        column :user_name, :text
        column :password, :text
        column :auth_method, :text
        column :ssl, :boolean
        column :environment, :text
      end
    end
  end
end
