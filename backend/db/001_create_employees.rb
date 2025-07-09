Sequel.migration do
  change do
    create_table :employees do
      primary_key :id
      String :employee_id, unique: true
      String :first_name
      String :last_name
      String :middle_name
      String :preferred_name
      String :gender
      String :blood_group
      String :nationality
      String :marital_status
      String :languages
      String :passport
      String :pan
      String :aadhar
      String :religion
      String :photo
      String :personal_email, unique: true
      String :official_email, unique: true
      String :mobile
      String :alternate_contact
      String :present_address
      String :permanent_address
      String :emergency_contact_name
      String :emergency_contact_relationship
      String :emergency_contact_number
      String :emergency_contact_address
      String :disability
      String :qualification
      String :specialization
      String :university
      String :year_of_passing
      String :academic_score
      String :department
      String :designation
      String :reporting_manager
      String :employment_type
      String :work_location
      String :work_shift
      String :probation
      Date :confirmation_date
      Date :date_of_joining
      Date :date_of_birth
      String :employee_status
      Date :relieving_date
      String :relieving_reason
      DateTime :created_at
      index :employee_id
      index :personal_emails
    end
  end
end