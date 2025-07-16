
require 'roda'
require 'bcrypt'
require 'sequel'
require 'json'
require 'fileutils'
require 'yaml'
require 'tzinfo'
require 'date'
require 'securerandom'
require 'dotenv/load'
require 'logger'
require 'mail'
require_relative 'config/mail_config'

IST = TZInfo::Timezone.get('Asia/Kolkata')

begin
  database_config = ENV['DATABASE_URL'] || Psych.load_file(File.expand_path('config/database.yml', __dir__))['development']
  DB = Sequel.connect(database_config)
rescue => e
  abort "Database error: #{e.message}"
end

log_dir = File.expand_path('log', __dir__)
FileUtils.mkdir_p(log_dir)
LOGGER = Logger.new(File.join(log_dir, 'development.log'))

class App < Roda
  plugin :json
  plugin :json_parser
  plugin :all_verbs
  plugin :hooks
  plugin :halt
  plugin :middleware
  plugin :sessions, secret: ENV['SESSION_SECRET'] || SecureRandom.base64(64), cookie_options: {
    path: '/', same_site: :lax, secure: ENV['RACK_ENV'] == 'production', http_only: true
  }

  ALLOWED_ORIGINS = ENV['ALLOWED_ORIGINS']&.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173']
  APP_DOMAIN = ENV['FRONTEND_URL'] || 'http://localhost:5173'
  
  before do
    next unless request.path.start_with?('/api')
    origin = request.env['HTTP_ORIGIN']
    method = request.request_method
    timestamp = IST.now.iso8601

    LOGGER.info "[CORS] Origin: #{origin} | Method: #{method} | Path: #{request.path}"

    if origin && ALLOWED_ORIGINS.include?(origin)
      response['Access-Control-Allow-Origin'] = origin
      response['Access-Control-Allow-Credentials'] = 'true'
      response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      response['Access-Control-Allow-Headers'] = 'Content-Type, Accept, Authorization, X-Requested-With'
      response['Access-Control-Max-Age'] = '86400'

      if method == 'OPTIONS'
        response.status = 204
        response['Content-Length'] = '0'
        request.halt
      end
    elsif method != 'GET'
      response.status = 403
      response.write("CORS Forbidden")
      request.halt
    end
  end

  route do |r|
    r.root do
      { message: "Welcome to the API. Use /api/v1/employees for employee management." }
    end

    r.on 'api', 'v1' do
      r.on 'employees' do

        r.is do
          r.get do
            DB[:employees].all.map { |emp| emp.merge(id: emp[:employee_id]) }
          end

          r.post do
            timestamp = IST.now.iso8601
            LOGGER.info "[#{timestamp}] [POST /api/v1/employees] Incoming request"

            begin
              data = JSON.parse(r.body.read)
              LOGGER.info "[#{timestamp}] [POST /api/v1/employees] Payload: #{data.inspect}"

              required = %w[
                employee_id official_email personal_email
                first_name last_name date_of_birth
                mobile qualification department designation
                employment_type date_of_joining employee_status
              ]

              # Assign default password only if not provided
              data['password'] = 'user@123' if data['password'].to_s.strip.empty?

              missing = required.select { |f| data[f].to_s.strip.empty? }
              missing << 'password' if data['password'].to_s.strip.empty?

              if missing.any?
                response.status = 400
                LOGGER.warn "[#{timestamp}] [POST /api/v1/employees] Missing fields: #{missing.join(', ')}"
                { error: "Missing required fields: #{missing.join(', ')}" }
              else
                hashed_password = BCrypt::Password.create(data["password"])
                now = Time.now

                DB[:employees].insert(
                  employee_id: data["employee_id"].upcase,
                  official_email: data["official_email"].downcase,
                  personal_email: data["personal_email"].downcase,
                  first_name: data["first_name"],
                  middle_name: data["middle_name"],
                  last_name: data["last_name"],
                  gender: data["gender"],
                  blood_group: data["blood_group"],
                  date_of_birth: data["date_of_birth"],
                  mobile: data["mobile"],
                  alternate_contact: data["alternate_contact"],
                  emergency_contact_number: data["emergency_contact_number"],
                  present_address: data["present_address"],
                  permanent_address: data["permanent_address"],
                  qualification: data["qualification"],
                  department: data["department"],
                  designation: data["designation"],
                  reporting_manager: data["reporting_manager"],
                  employment_type: data["employment_type"],
                  work_shift: data["work_shift"],
                  confirmation_date: data["confirmation_date"],
                  relieving_date: data["relieving_date"],
                  date_of_joining: data["date_of_joining"],
                  employee_status: data["employee_status"],
                  password: hashed_password,
                  created_at: now,
                  updated_at: now
                )

                response.status = 201
                LOGGER.info "[#{timestamp}] Employee created: #{data["employee_id"]}"
                { success: true, message: "Employee created successfully", employee_id: data["employee_id"] }
              end
            rescue JSON::ParserError => e
              response.status = 400
              LOGGER.error "[#{timestamp}] Invalid JSON: #{e.message}"
              { error: "Invalid JSON" }
            rescue Sequel::UniqueConstraintViolation
              response.status = 409
              LOGGER.warn "[#{timestamp}] Duplicate employee_id or email"
              { error: "Employee ID or email already exists" }
            rescue => e
              response.status = 500
              LOGGER.error "[#{timestamp}] Internal error: #{e.message}"
              { error: "Internal server error" }
            end
          end
        end

        # GET /api/v1/employees/me
        r.get 'me' do
          if r.session[:employee_id]
            emp = DB[:employees].where(employee_id: r.session[:employee_id]).first
            if emp
              emp = emp.dup.tap { |e| e.delete(:password) }
              emp.merge(id: emp[:employee_id])
            else
              response.status = 404
              { error: 'Employee not found' }
            end
          else
            response.status = 401
            { error: 'Unauthorized' }
            #{ logged_in: false }
          end
        end

        # POST /api/v1/employees/login
        r.post 'login' do
          data = JSON.parse(r.body.read)
          employee_id = data['employee_id']&.upcase&.strip
          email = data['official_email']&.downcase&.strip
          password = data['password']

          emp = DB[:employees].where(employee_id: employee_id, official_email: email).first
          if emp && BCrypt::Password.new(emp[:password]) == password
            r.session.clear
            r.session[:employee_id] = employee_id
            { success: true, message: "Login successful", employee_id: employee_id }
          else
            response.status = 401
            { error: "Invalid credentials" }
          end
        end
      

        # POST /api/v1/employees/password-reset
        r.post "password_reset_request" do
          timestamp = IST.now.iso8601
          LOGGER.info "[RESET_REQUEST] Raw params: #{r.params.inspect}"
          eid = r.params['employee_id']&.strip&.upcase
          LOGGER.info "[#{timestamp}] [POST password_reset_request] Payload: #{eid}"
          halt 400, { error: "Missing employee ID" } unless eid
        
          employee = DB[:employees][employee_id: eid]
          LOGGER.info "[#{timestamp}] [POST password_reset_request] Payload: #{employee}"
          halt 404, { error: "Employee not found" } unless employee
        
          token = SecureRandom.hex(32)
          DB[:password_resets].insert(
            employee_id: eid,
            reset_token: token,
            expires_at: Time.now + 120, # 2 mins
            created_at: Time.now
          )
                    # Construct reset link (replace BASE_URL with frontend app's domain)
          reset_link = "#{APP_DOMAIN}/reset-password?token=#{token}"
        
          # Send email
          Mail.deliver do
            from     'madhuri.ratnala@srinishtha.com'
            to       employee[:official_email]
            subject  'Password Reset Request'
            body     "Click the following link to reset your password:\n\n#{reset_link}\n\nThis link is valid for 2 minutes."
          end
        
          { success: true, message: "Reset link sent to official email" }.to_json
         # { success: true, message: "Reset token generated", token: token }.to_json
        end

        # POST /api/v1/employees/update-password
        r.post 'update-password' do
          begin
            data = JSON.parse(r.body.read)
            token = data['token']&.strip
            employee_id = data['employee_id']&.upcase&.strip
            email = data['official_email']&.downcase&.strip
            new_password = data['new_password']&.strip
        
            unless token && employee_id && email && new_password
              response.status = 400
              next { error: 'Missing required fields' }
            end
        
            reset = DB[:password_resets][reset_token: token]
            unless reset && reset[:employee_id] == employee_id && reset[:expires_at] > Time.now
              response.status = 400
              next { error: 'Invalid or expired token' }
            end
        
            emp = DB[:employees][employee_id: employee_id, official_email: email]
            unless emp
              response.status = 404
              next { error: 'Employee verification failed' }
            end
        
            hashed = BCrypt::Password.create(new_password)
            DB[:employees].where(employee_id: employee_id).update(password: hashed)
            DB[:password_resets].where(reset_token: token).delete
        
            {
              success: true,
              message: 'Password updated successfully',
              user: {
                employee_id: emp[:employee_id],
                official_email: emp[:official_email]
              }
            }
          rescue JSON::ParserError
            response.status = 400
            { error: 'Invalid JSON payload' }
          rescue => e
            response.status = 500
            LOGGER.error "[POST /api/v1/employees/update-password] Error: #{e.message}"
            { error: 'Internal server error' }
          end
        end

        r.post 'logout' do
          timestamp = IST.now.iso8601
          LOGGER.info "[#{timestamp}] [POST /api/v1/employees/logout] Called"
        
          if r.session[:employee_id]
            emp_id = r.session[:employee_id]
            r.session.clear
            response.status = 200
            LOGGER.info "[#{timestamp}] [POST /api/v1/employees/logout] Success for employee_id: #{emp_id}"
            { success: true, message: 'Logged out successfully', employee_id: emp_id }
          else
            response.status = 401
            LOGGER.warn "[#{timestamp}] [POST /api/v1/employees/logout] Failed - No active session"
            { error: 'No active session found' }
          end
        end
        
        # PUT /api/v1/employees/:employee_id => Update employee
        r.put String do |employee_id|
          begin
            timestamp = IST.now.iso8601
            data = JSON.parse(r.body.read)
            LOGGER.info "[#{timestamp}] [PUT /api/v1/employees/#{employee_id}] Payload: #{data.inspect}"

            emp = DB[:employees].where(employee_id: employee_id.upcase).first
            if !emp
              response.status = 404
              LOGGER.warn "[#{timestamp}] [PUT /api/v1/employees/#{employee_id}] Employee not found"
              { error: "Employee not found" }
            else
              data["updated_at"] = Time.now
              if data["password"]
                data["password"] = BCrypt::Password.create(data["password"])
              else
                data.delete("password")
              end
              begin
                DB[:employees].where(employee_id: employee_id.upcase).update(data)
                response.status = 200
                LOGGER.info "[#{timestamp}] [PUT /api/v1/employees/#{employee_id}] Employee updated"
                { success: true, message: "Employee updated successfully" }
              rescue Sequel::UniqueConstraintViolation => e
                response.status = 409
                LOGGER.warn "[#{timestamp}] [PUT /api/v1/employees/#{employee_id}] Duplicate email"
                { error: "Email already exists" }
              end
            end
          rescue JSON::ParserError => e
            response.status = 400
            LOGGER.error "[#{timestamp}] [PUT /api/v1/employees/#{employee_id}] Invalid JSON: #{e.message}"
            { error: "Invalid JSON" }
          rescue => e
            LOGGER.error "[#{timestamp}] [PUT /api/v1/employees/#{employee_id}] Error: #{e.message}"
            response.status = 500
            { error: "Failed to update employee" }
          end
        end # end r.put String

        r.get String do |employee_id|
          emp = DB[:employees].where(employee_id: employee_id.upcase).first
          if emp
            emp = emp.dup.tap { |e| e.delete(:password) }
            emp.merge(id: emp[:employee_id])
          else
            response.status = 404
            { error: 'Employee not found' }
          end
        end       
        end # end r.on "employees"

      r.on "leave-requests" do
        timestamp = IST.now.iso8601

        r.get do
          begin
            leaves = DB[:leaves]
              .order(Sequel.desc(:submitted_at))
              .select(
                :id, :employee_id, :employee_email, :leave_type, :day_type,
                :reason, :start_date, :end_date, :duration, :status, :submitted_at
              ).all
            response.status = 200
            leaves
          rescue => e
            LOGGER.error "[#{timestamp}] [GET /api/v1/leave-requests] Error: #{e.message}"
            response.status = 500
            { error: "Failed to fetch leave requests: #{e.message}" }
          end
        end # end r.get (leave-requests)

        r.post do
          begin
            data = JSON.parse(r.body.read)
            LOGGER.info "[#{timestamp}] [POST /api/v1/leave-requests] Payload: #{data.inspect}"

            required = %w[leaveType dayType reason startDate endDate duration]
            missing = required.reject { |k| data[k] && !data[k].to_s.strip.empty? }
            if missing.any?
              response.status = 400
              { error: "Missing required fields: #{missing.join(', ')}" }
            elsif !r.session[:employee_id]
              response.status = 401
              { error: "Unauthorized: Please log in" }
            else
              employee_id = r.session[:employee_id]
              emp = DB[:employees].where(employee_id: employee_id).first
              if !emp
                response.status = 404
                { error: "Employee not found" }
              else
                new_id = DB[:leaves].insert(
                  employee_id: employee_id,
                  employee_email: emp[:official_email],
                  leave_type: data["leaveType"],
                  day_type: data["dayType"],
                  reason: data["reason"],
                  start_date: data["startDate"],
                  end_date: data["endDate"],
                  duration: data["duration"].to_f,
                  status: data["status"] || "Pending",
                  submitted_at: Time.now
                )
                new_leave = DB[:leaves][id: new_id]
                response.status = 201
                new_leave
              end
            end
          rescue JSON::ParserError => e
            LOGGER.error "[#{timestamp}] [POST /api/v1/leave-requests] Invalid JSON: #{e.message}"
            response.status = 400
            { error: "Invalid JSON" }
          rescue => e
            LOGGER.error "[#{timestamp}] [POST /api/v1/leave-requests] Error: #{e.message}"
            response.status = 500
            { error: "Internal Server Error: #{e.message}" }
          end
        end # end r.post (leave-requests)

        r.patch Integer do |id|
          begin
            data = JSON.parse(r.body.read)
            new_status = data["status"]
            if !new_status
              response.status = 400
              { error: "Missing status field" }
            else
              updated = DB[:leaves][id: id]
              if !updated
                response.status = 404
                { error: "Leave request not found" }
              else
                DB[:leaves].where(id: id).update(status: new_status)
                updated_status = DB[:leaves][id: id]
                response.status = 200
                updated_status
              end
            end
          rescue JSON::ParserError => e
            LOGGER.error "[#{timestamp}] [PATCH /api/v1/leave-requests/#{id}] Invalid JSON: #{e.message}"
            response.status = 400
            { error: "Invalid JSON" }
          rescue => e
            LOGGER.error "[#{timestamp}] [PATCH /api/v1/leave-requests/#{id}] Error: #{e.message}"
            response.status = 500
            { error: "Failed to update leave request: #{e.message}" }
          end
        end # end r.patch Integer

        r.delete Integer do |id|
          begin
            deleted = DB[:leaves].where(id: id).first
            if !deleted
              response.status = 404
              { error: "Leave request not found" }
            else
              DB[:leaves].where(id: id).delete
              response.status = 200
              { success: true, message: "Leave request deleted" }
            end
          rescue => e
            LOGGER.error "[#{timestamp}] [DELETE /api/v1/leave-requests/#{id}] Error: #{e.message}"
            response.status = 500
            { error: "Failed to delete leave request: #{e.message}" }
          end
        end # end r.delete Integer
      end # end r.on "leave-requests"

      r.on "announcements" do
        r.get do
          timestamp = IST.now.iso8601
          LOGGER.info "[#{timestamp}] [GET /api/v1/announcements] Called"
          announcements = DB[:announcements].order(Sequel.desc(:created_at)).map do |a|
            {
              id: a[:id],
              title: a[:title],
              description: a[:description],
              posted: IST.local_to_utc(a[:created_at]).iso8601
            }
          end
          LOGGER.info "[#{timestamp}] [GET /api/v1/announcements] Response: 200 OK - #{announcements.length} announcements returned"
          response.status = 200
          announcements
        end # end r.get (announcements)

        r.post do
          timestamp = IST.now.iso8601
          begin
            request_body = r.body.read
            LOGGER.info "[#{timestamp}] [POST /api/v1/announcements] Called with body: #{request_body}"
            data = JSON.parse(request_body)
            title, description = data.values_at("title", "description")
            if !title || !description || title.strip.empty? || description.strip.empty?
              LOGGER.info "[#{timestamp}] [POST /api/v1/announcements] Response: 400 Bad Request - Missing title or description"
              response.status = 400
              { error: "Missing or empty title or description" }
            else
              now = IST.now
              id = DB[:announcements].insert(title: title.strip, description: description.strip, created_at: now)
              LOGGER.info "[#{timestamp}] [POST /api/v1/announcements] Response: 201 Created - Announcement created with ID: #{id}"
              response.status = 201
              { id: id, title: title.strip, description: description.strip, posted: now.iso8601 }
            end
          rescue JSON::ParserError => e
            LOGGER.error "[#{timestamp}] [POST /api/v1/announcements] Invalid JSON: #{e.message}"
            response.status = 400
            { error: "Invalid JSON: #{e.message}" }
          rescue Sequel::DatabaseError => e
            LOGGER.error "[#{timestamp}] [POST /api/v1/announcements] Database error: #{e.message}"
            response.status = 500
            { error: "Database error: #{e.message}" }
          rescue => e
            LOGGER.error "[#{timestamp}] [POST /api/v1/announcements] Unexpected error: #{e.message}"
            response.status = 500
            { error: "Internal server error: #{e.message}" }
          end
        end # end r.post (announcements)
      end # end r.on "announcements"

      r.on "policies" do
        r.get do
          timestamp = IST.now.iso8601
          LOGGER.info "[#{timestamp}] [GET /api/v1/policies] Called"
          policies = DB[:company_policies].order(Sequel.desc(:created_at)).map do |policy|
            {
              id: policy[:id],
              title: policy[:title],
              file_name: policy[:file_name],
              file_url: "http://localhost:9292#{policy[:file_path]}",
              is_hidden: policy[:is_hidden],
              created_at: IST.local_to_utc(policy[:created_at]).iso8601
            }
          end
          LOGGER.info "[#{timestamp}] [GET /api/v1/policies] Response: 200 OK - #{policies.length} policies returned"
          response.status = 200
          policies
        end # end r.get (policies)

        r.post do
          timestamp = IST.now.iso8601
          begin
            LOGGER.info "[#{timestamp}] [POST /api/v1/policies] Called with params: #{r.params.inspect}"
            title = r.params['title']&.strip
            file = r.params['file']
            if !title || !file
              LOGGER.info "[#{timestamp}] [POST /api/v1/policies] Response: 400 Bad Request - Missing title or file"
              response.status = 400
              { error: 'Missing or empty title or file' }
            else
              allowed_mime_types = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
              if !allowed_mime_types.include?(file[:type])
                LOGGER.warn "[#{timestamp}] [POST /api/v1/policies] Response: 400 Bad Request - Invalid file type: #{file[:type]}"
                response.status = 400
                { error: "Only PDF, DOC, or DOCX files are allowed" }
              elsif file[:tempfile].size > 10 * 1024 * 1024
                LOGGER.info "[#{timestamp}] [POST /api/v1/policies] Response: 400 Bad Request - File size exceeds limit"
                response.status = 400
                { error: "File size exceeds 10MB limit" }
              else
                uploads_dir = File.expand_path("public/uploads", __dir__)
                FileUtils.mkdir_p(uploads_dir) unless Dir.exist?(uploads_dir)
                sanitized_name = file[:filename].gsub(/[^\w\.\-]/, '_')
                new_filename = "#{Time.now.to_i}_#{sanitized_name}"
                file_path = File.join(uploads_dir, new_filename)
                File.open(file_path, 'wb') { |f| f.write(file[:tempfile].read) }
                id = DB[:company_policies].insert(
                  title: title,
                  file_name: file[:filename],
                  file_path: "/uploads/#{new_filename}",
                  is_hidden: false,
                  created_at: IST.now
                )
                LOGGER.info "[#{timestamp}] [POST /api/v1/policies] Response: 201 Created - Policy created with ID: #{id}"
                response.status = 201
                { success: true, id: id }
              end
            end
          rescue => e
            LOGGER.error "[#{timestamp}] [POST /api/v1/policies] Error: #{e.message}"
            response.status = 500
            { error: "Internal server error: #{e.message}" }
          end
        end # end r.post (policies)

        r.on Integer do |id|
          r.patch "hide" do
            timestamp = IST.now.iso8601
            begin
              LOGGER.info "[#{timestamp}] [PATCH /api/v1/policies/#{id}/hide] Called"
              row = DB[:company_policies][id: id]
              if !row
                LOGGER.warn "[#{timestamp}] [PATCH /api/v1/policies/#{id}/hide] Response: 404 Not Found - Policy not found"
                response.status = 404
                { error: 'Policy not found' }
              else
                DB[:company_policies].where(id: id).update(is_hidden: !row[:is_hidden])
                LOGGER.info "[#{timestamp}] [PATCH /api/v1/policies/#{id}/hide] Response: 200 OK - Success"
                response.status = 200
                { success: true }
              end
            rescue => e
              LOGGER.error "[#{timestamp}] [PATCH /api/v1/policies/#{id}/hide] Error: #{e.message}"
              response.status = 500
              { error: "Internal server error: #{e.message}" }
            end
          end # end r.patch "hide"

          r.patch "file" do
            timestamp = IST.now.iso8601
            begin
              LOGGER.info "[#{timestamp}] [PATCH /api/v1/policies/#{id}/file] Called with params: #{r.params.inspect}"
              file = r.params['file']
              if !file
                LOGGER.info "[#{timestamp}] [PATCH /api/v1/policies/#{id}/file] Response: 400 Bad Request - Missing file"
                response.status = 400
                { error: 'Missing file' }
              else
                row = DB[:company_policies][id: id]
                if !row
                  LOGGER.warn "[#{timestamp}] [PATCH /api/v1/policies/#{id}/file] Response: 404 Not Found - Policy not found"
                  response.status = 404
                  { error: 'Policy not found' }
                else
                  allowed_mime_types = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                  if !allowed_mime_types.include?(file[:type])
                    LOGGER.warn "[#{timestamp}] [PATCH /api/v1/policies/#{id}/file] Response: 400 Bad Request - Invalid file type: #{file[:type]}"
                    response.status = 400
                    { error: "Only PDF, DOC, or DOCX files are allowed" }
                  elsif file[:tempfile].size > 10 * 1024 * 1024
                    LOGGER.info "[#{timestamp}] [PATCH /api/v1/policies/#{id}/file] Response: 400 Bad Request - File size exceeds limit"
                    response.status = 400
                    { error: "File size exceeds 10MB limit" }
                  else
                    uploads_dir = File.expand_path("public/uploads", __dir__)
                    FileUtils.mkdir_p(uploads_dir) unless Dir.exist?(uploads_dir)
                    sanitized_name = file[:filename].gsub(/[^\w\.\-]/, '_')
                    new_filename = "#{Time.now.to_i}_#{id}_#{sanitized_name}"
                    file_path = File.join(uploads_dir, new_filename)
                    File.open(file_path, 'wb') { |f| f.write(file[:tempfile].read) }
                    DB[:company_policies].where(id: id).update(
                      file_name: file[:filename],
                      file_path: "/uploads/#{new_filename}"
                    )
                    LOGGER.info "[#{timestamp}] [PATCH /api/v1/policies/#{id}/file] Response: 200 OK - Policy file updated"
                    response.status = 200
                    { success: true }
                  end
                end
              end
            rescue => e
              LOGGER.error "[#{timestamp}] [PATCH /api/v1/policies/#{id}/file] Error: #{e.message}"
              response.status = 500
              { error: "Internal server error: #{e.message}" }
            end
          end # end r.patch "file"
        end # end r.on Integer (policies)
      end # end r.on "policies"
	  
	  r.on "benefits" do
	    # GET /api/v1/benefits/view => view for payslips based on employee_id, month, year
	    r.get "view" do
          if r.params['employee_id'] && r.params['month'] && r.params['year']
            eid = r.params['employee_id']&.upcase
            month = r.params['month']
            year  = r.params['year']
        
            expected_name = "#{eid}_#{month}_#{year}.pdf"
            rec = DB[:benefits].where(file_name: expected_name).first
            halt 404, { error: "Payslip not found" } unless rec
        
            filepath = File.expand_path("public#{rec[:file_path]}", __dir__)
            halt 404, { error: 'File missing' } unless File.exist?(filepath)
        
            ext = File.extname(filepath).downcase
            content_type = case ext
                           when '.pdf' then 'application/pdf'
                           when '.docx' then 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                           else 'application/octet-stream'
                           end
        
            response['Content-Type'] = content_type
            response['Content-Disposition'] = 'inline'
            request.halt File.binread(filepath)
          end
        end
		
	    # GET /api/v1/benefits/view/:id => Inline view in browser
	    r.get "view", Integer do |id|
	  	  LOGGER.info "[VIEW] Requested ID: #{id}"
	  	  rec = DB[:benefits][id: id]
	  	  unless rec
            LOGGER.error "[VIEW] No record found for ID: #{id}"
            halt 404, { error: 'Not found' }
          end
	  
          filepath = File.expand_path("public#{rec[:file_path]}", __dir__)
          LOGGER.info "[VIEW] File path resolved: #{filepath}"
          LOGGER.info "[VIEW] File name: #{rec[:file_name]}"
	  
          unless File.exist?(filepath)
            LOGGER.error "[VIEW] File not found on disk: #{filepath}"
            halt 404, { error: 'File missing' }
          end
	  	
	  	  ext = File.extname(filepath).downcase
	  	  content_type = case ext
	  				   when '.pdf' then 'application/pdf'
	  				   when '.docx' then 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	  				   when '.doc' then 'application/msword'
	  				   else 'application/octet-stream'
	  				   end
	  
	  	  response['Content-Type'] = content_type
	  	  response['Content-Disposition'] = 'inline'
	  	  response['Access-Control-Allow-Origin'] = '*'
	  	  response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
	  	  response['Access-Control-Allow-Headers'] = 'Content-Type'
	  
	  	  request.halt File.binread(filepath)
	    end
	    
		# GET /api/v1/benefits/download => Force download for payslips based on employee_id, month, year
		r.get "download" do
          eid = r.params['employee_id']&.upcase
          month = r.params['month']
          year  = r.params['year']
        
          halt 400, { error: 'Missing employee_id, month or year' } unless eid && month && year
        
          expected_filename = "#{eid}_#{month}_#{year}.pdf"
          rec = DB[:benefits].where(file_name: expected_filename).first
        
          halt 404, { error: 'Payslip not found' } unless rec
        
          filepath = File.expand_path("public#{rec[:file_path]}", __dir__)
          halt 404, { error: 'File missing' } unless File.exist?(filepath)
        
          response['Content-Type'] = 'application/octet-stream'
          response['Content-Disposition'] = %{attachment; filename="#{rec[:file_name]}"}
          response['Access-Control-Allow-Origin'] = '*'
          response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
          response['Access-Control-Allow-Headers'] = 'Content-Type'
        
          request.halt File.binread(filepath)
        end

	    # GET /api/v1/benefits/download/:id => Force download
	    r.get "download", Integer do |id|
		  LOGGER.info "[DOWNLOAD] Requested ID: #{id}"
	  	  rec = DB[:benefits][id: id]
	  	  halt 404, { error: 'Not found' } unless rec
	  
	  	  filepath = File.expand_path("public#{rec[:file_path]}", __dir__)
		  LOGGER.info "[DOWNLOAD] File path resolved: #{filepath}"
          LOGGER.info "[DOWNLOAD] File name: #{rec[:file_name]}"
	  	  halt 404, { error: 'File missing' } unless File.exist?(filepath)
	  
	  	  response['Content-Type'] = 'application/octet-stream'
	  	  response['Content-Disposition'] = %{attachment; filename="#{rec[:file_name]}"}
	  	  #response['Access-Control-Allow-Origin'] = '*'
	  	  #response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
	  	  #response['Access-Control-Allow-Headers'] = 'Content-Type'
	  
	  	  request.halt File.binread(filepath)
	    end
			    
	    # GET /api/v1/benefits => List all benefits
	    r.get do
	  	  LOGGER.info "GET /benefits"
	  	  DB[:benefits]
	  	    .order(Sequel.desc(:created_at))
	  	    .all
	  	    .map do |b|
	  		  {
	  		    id: b[:id],
	  		    type: b[:type],
	  		    employee_id: b[:employee_id],
	  		    file_name: b[:file_name],
	  		    file_path: b[:file_path],
	  		    file_url: "http://localhost:9292/api/v1/benefits/view/#{b[:id]}",
	  		    download_url: "http://localhost:9292/api/v1/benefits/download/#{b[:id]}",
	  		    created_at: b[:created_at].iso8601
	  		  }
	  	    end
	    end
	  
	    # POST /api/v1/benefits => Upload a new file
	    r.post do
          type = r.params['type']&.strip
          eid  = r.params['employee_id']&.upcase&.strip
          file = r.params['file']
        
          halt 400, { error: "Missing type or employee_id" } unless type && eid
          halt 404, { error: "Employee not found" } if DB[:employees].where(employee_id: eid).empty?
          halt 400, { error: "Missing file" } unless file
        
          allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
          halt 400, { error: "Only PDF or DOCX allowed" } unless allowed.include?(file[:type])
          halt 400, { error: "Max 10MB" } if file[:tempfile].size > 10 * 1024 * 1024
        
          # Setup directory
          dir = File.expand_path("public/uploads", __dir__)
          FileUtils.mkdir_p(dir)
        
          # Extract file extension
          original_ext = File.extname(file[:filename]).downcase
          timestamp = Time.now
          month_str = timestamp.strftime('%m') # "07"
          year_str  = timestamp.strftime('%Y') # "2025"
        
          # Filename logic for Pay Slips
          if type.downcase == 'pay slips'
            clean_name = "#{eid}_#{month_str}_#{year_str}#{original_ext}"
          else
            # Fallback: timestamp + cleaned original filename
            clean_name = "#{Time.now.to_i}_#{file[:filename].gsub(/[^\w.\-]/, '_')}"
          end
        
          path = File.join(dir, clean_name)
          File.write(path, file[:tempfile].read)
        
          id = DB[:benefits].insert(
            type: type,
            employee_id: eid,
            file_name: clean_name,
            file_path: "/uploads/#{clean_name}",
            created_at: Time.now
          )
        
          response.status = 201
          { success: true, id: id }
        end
	  end   # GET /api/v1/benefits
      
      r.on "admin", "events" do
        events = DB[:events]

        r.get do
          timestamp = IST.now.iso8601
          LOGGER.info "[#{timestamp}] [GET /api/v1/admin/events] Called"
          response.status = 200
          events.order(Sequel.desc(:added_at)).all
        rescue => e
          LOGGER.error "[#{timestamp}] [GET /api/v1/admin/events] Error: #{e.message}"
          response.status = 500
          { error: "Internal server error: #{e.message}" }
        end # end r.get (events)

        r.post do
          timestamp = IST.now.iso8601
          begin
            request_body = r.body.read
            LOGGER.info "[#{timestamp}] [POST /api/v1/admin/events] Called with body: #{request_body}"
            data = JSON.parse(request_body)
            title, date = data.values_at("title", "date")
            if !title || !date
              LOGGER.info "[#{timestamp}] [POST /api/v1/admin/events] Response: 400 Bad Request - Missing title or date"
              response.status = 400
              { error: "Missing title or date" }
            else
              id = events.insert(title: title.strip, date: date, added_at: IST.now)
              LOGGER.info "[#{timestamp}] [POST /api/v1/admin/events] Response: 201 Created - Event created with ID: #{id}"
              response.status = 201
              events.where(id: id).first
            end
          rescue JSON::ParserError => e
            LOGGER.error "[#{timestamp}] [POST /api/v1/admin/events] Invalid JSON: #{e.message}"
            response.status = 400
            { error: "Invalid JSON: #{e.message}" }
          rescue => e
            LOGGER.error "[#{timestamp}] [POST /api/v1/admin/events] Error: #{e.message}"
            response.status = 500
            { error: "Internal server error: #{e.message}" }
          end
        end # end r.post (events)

        r.on Integer do |id|
          r.put do
            timestamp = IST.now.iso8601
            begin
              request_body = r.body.read
              LOGGER.info "[#{timestamp}] [PUT /api/v1/admin/events/#{id}] Called with body: #{request_body}"
              data = JSON.parse(request_body)
              title, date = data.values_at("title", "date")
              if !title || !date
                LOGGER.info "[#{timestamp}] [PUT /api/v1/admin/events/#{id}] Response: 400 Bad Request - Missing title or date"
                response.status = 400
                { error: "Missing title or date" }
              else
                updated = events.where(id: id).update(title: title.strip, date: date, added_at: IST.now)
                if updated > 0
                  LOGGER.info "[#{timestamp}] [PUT /api/v1/admin/events/#{id}] Response: 200 OK - Event updated"
                  response.status = 200
                  { success: true, message: "Event updated" }
                else
                  LOGGER.info "[#{timestamp}] [PUT /api/v1/admin/events/#{id}] Response: 404 Not Found"
                  response.status = 404
                  { error: "Event not found" }
                end
              end
            rescue JSON::ParserError => e
              LOGGER.error "[#{timestamp}] [PUT /api/v1/admin/events/#{id}] Invalid JSON: #{e.message}"
              response.status = 400
              { error: "Invalid JSON: #{e.message}" }
            rescue => e
              LOGGER.error "[#{timestamp}] [PUT /api/v1/admin/events/#{id}] Error: #{e.message}"
              response.status = 500
              { error: "Internal server error: #{e.message}" }
            end
          end # end r.put (events)

          r.delete do
            timestamp = IST.now.iso8601
            begin
              LOGGER.info "[#{timestamp}] [DELETE /api/v1/admin/events/#{id}] Called"
              deleted = events.where(id: id).delete
              if deleted > 0
                LOGGER.info "[#{timestamp}] [DELETE /api/v1/admin/events/#{id}] Response: 200 OK - Event deleted"
                response.status = 200
                { success: true }
              else
                LOGGER.info "[#{timestamp}] [DELETE /api/v1/admin/events/#{id}] Response: 404 Not Found"
                response.status = 404
                { error: "Event not found" }
              end
            rescue => e
              LOGGER.error "[#{timestamp}] [DELETE /api/v1/admin/events/#{id}] Error: #{e.message}"
              response.status = 500
              { error: "Internal server error: #{e.message}" }
            end
          end # end r.delete (events)
        end # end r.on Integer (events)
      end # end r.on "admin", "events"
    end # end r.on 'api', 'v1'
  end # end route
end# end class App