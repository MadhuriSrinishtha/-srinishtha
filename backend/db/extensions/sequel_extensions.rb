class Sequel::Database
  def table_exists?(name)
    from(:pg_tables).where(tablename: name.to_s, schemaname: 'public').count > 0
  end
end
