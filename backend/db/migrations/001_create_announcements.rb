class CreateAnnouncements < ActiveRecord::Migration[7.1]
  def change
    create_table :announcements do |t|
      t.string :title, null: false
      t.string :description, null: false
      t.timestamps
    end
  end
end
