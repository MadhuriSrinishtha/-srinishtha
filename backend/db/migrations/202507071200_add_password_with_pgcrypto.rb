class AddPasswordWithPgcrypto < Sequel::Migration
  def up
    run 'CREATE EXTENSION IF NOT EXISTS pgcrypto;'
    alter_table(:employees) do
      add_column :password, String, null: false, default: Sequel.function(:crypt, 'user@123', Sequel.function(:gen_salt, 'bf'))
    end
  end

  def down
    alter_table(:employees) do
      drop_column :password
    end
    run 'DROP EXTENSION IF EXISTS pgcrypto;'
  end
end