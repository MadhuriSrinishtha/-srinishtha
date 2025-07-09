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
require 'rack/cors'

# Connect to PostgreSQL database
DB = Sequel.connect(ENV['DATABASE_URL'] || YAML.load_file('config/database.yml')['development'])

# Configure logger
log_dir = File.expand_path('log', __dir__)
FileUtils.mkdir_p(log_dir)
LOGGER = Logger.new(File.join(log_dir, 'development.log'))

class App < Roda
  plugin :json
  plugin :all_verbs
  plugin :hooks
  plugin :halt
  plugin :middleware
  plugin :sessions, secret: ENV['SESSION_SECRET'] || SecureRandom.base64(64)
  plugin :public

  ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ]

  before do
    next unless request.path.start_with?("/api")
    origin = request.env['HTTP_ORIGIN']
    if origin.nil?
      next
    end
    if ALLOWED_ORIGINS.include?(origin)
      response['Access-Control-Allow-Origin'] = origin
      response['Access-Control-Allow-Credentials'] = 'true'
      response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      response['Access-Control-Allow-Headers'] = 'Content-Type, Accept, Authorization, X-Requested-With'
      response['Access-Control-Max-Age'] = '86400'
      if request.request_method == 'OPTIONS'
        response.status = 204
        response['Content-Length'] = '0'
        request.halt
      end
    else
      response.status = 403
      response.write("CORS Forbidden")
      request.halt
    end
  end

  route do |r|
    r.public # serve static files

    r.on "api", "v1" do
      r.on "employees" do
        valid_statuses = ['Active', 'On Leave', 'Resigned', 'Terminated']

        r.get String do |employee_id|
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          LOGGER.info "[#{timestamp}] GET /api/v1/employees/#{employee_id} called"
          emp = DB[:employees].where(employee_id: employee_id).select(
            :employee_id, :official_email, :personal_email, :first_name, :middle_name,
            :last_name, :gender, :blood_group, :date_of_birth, :mobile,
            :alternate_contact, :emergency_contact_number, :present_address,
            :permanent_address, :qualification, :department, :designation,
            :reporting_manager, :employment_type, :work_shift, :confirmation_date,
            :relieving_date, :date_of_joining, :employee_status
          ).first

          if emp
            LOGGER.info "[#{timestamp}] Response: 200 OK - Employee found: #{emp[:employee_id]}"
            emp
          else
            LOGGER.info "[#{timestamp}] Response: 404 Not Found - Employee not found: #{employee_id}"
            response.status = 404
            { error: "Employee not found" }
          end
        end

        r.get do
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          LOGGER.info "[#{timestamp}] GET /api/v1/employees called with params: #{r.params.inspect}"
          begin
            dataset = DB[:employees].order(Sequel.desc(:employee_id)).select(
              :employee_id, :official_email, :personal_email, :first_name, :middle_name,
              :last_name, :gender, :blood_group, :date_of_birth, :mobile,
              :alternate_contact, :emergency_contact_number, :present_address,
              :permanent_address, :qualification, :department, :designation,
              :reporting_manager, :employment_type, :work_shift, :confirmation_date,
              :relieving_date, :date_of_joining, :employee_status
            )
            if r.params['search']
              search = "%#{r.params['search'].downcase}%"
              dataset = dataset.where(
                Sequel.ilike(:first_name, search) |
                Sequel.ilike(:last_name, search) |
                Sequel.ilike(:official_email, search) |
                Sequel.ilike(:employee_id, search)
              )
            end
            dataset.all.map do |emp|
              emp_hash = emp.to_hash
              emp_hash[:id] = emp[:employee_id]
              emp_hash
            end
          rescue => e
            LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - #{e.message}"
            response.status = 500
            { error: "Internal server error: #{e.message}" }
          end
        end

        r.get "me" do
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          LOGGER.info "[#{timestamp}] GET /api/v1/employees/me called"
          employee_id = r.session[:employee_id]
          LOGGER.info "[#{timestamp}] Session employee_id: #{employee_id.inspect}"
          unless employee_id
            LOGGER.info "[#{timestamp}] Response: 401 Unauthorized - No session"
            response.status = 401
            return { error: "Unauthorized: Please log in" }
          end

          emp = DB[:employees].where(employee_id: employee_id).select(
            :employee_id, :official_email, :first_name, :last_name
          ).first
          if emp
            LOGGER.info "[#{timestamp}] Response: 200 OK - Employee found: #{emp[:employee_id]}"
            emp
          else
            LOGGER.info "[#{timestamp}] Response: 404 Not Found - Employee not found: #{employee_id}"
            response.status = 404
            { error: "Employee not found" }
          end
        end

        r.post "login" do
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          begin
            request_body = r.body.read
            LOGGER.info "[#{timestamp}] POST /api/v1/employees/login called with body: #{request_body}"
            data = JSON.parse(request_body, symbolize_names: true)
            employee_id = data[:employee_id]&.strip
            official_email = data[:official_email]&.strip
            password = data[:password]&.strip

            missing_fields = [:employee_id, :official_email, :password].reject { |k| data[k] && !data[k].to_s.strip.empty? }
            if missing_fields.any?
              LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Missing fields: #{missing_fields.join(', ')}"
              response.status = 400
              return { error: "Missing required fields: #{missing_fields.join(', ')}" }
            end

            user = DB[:employees].where(employee_id: employee_id, official_email: official_email).first
            unless user
              LOGGER.info "[#{timestamp}] Response: 401 Unauthorized - Invalid credentials"
              response.status = 401
              return { error: "Invalid employee ID or official email. Please verify your credentials or use 'Forgot Password'." }
            end

            unless user[:password]
              LOGGER.info "[#{timestamp}] Response: 401 Unauthorized - No password set"
              response.status = 401
              return { error: "No password set for this account. Please use 'Forgot Password'." }
            end

            begin
              if BCrypt::Password.new(user[:password]) == password
                r.session[:employee_id] = user[:employee_id]
                LOGGER.info "[#{timestamp}] Response: 200 OK - Login successful"
                response.status = 200
                {
                  success: true,
                  message: "Login successful",
                  user: {
                    employee_id: user[:employee_id],
                    official_email: user[:official_email]
                  }
                }
              else
                LOGGER.info "[#{timestamp}] Response: 401 Unauthorized - Incorrect password"
                response.status = 401
                { error: "Incorrect password. Default password is 'user@123'. Use 'Forgot Password' if needed." }
              end
            rescue BCrypt::Errors::InvalidHash => e
              LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - Invalid password hash"
              response.status = 500
              { error: "Invalid password hash in database. Please contact support." }
            end
          rescue JSON::ParserError => e
            LOGGER.error "[#{timestamp}] Response: 400 Bad Request - Invalid JSON: #{e.message}"
            response.status = 400
            { error: "Invalid JSON: #{e.message}" }
          rescue Sequel::DatabaseError => e
            LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - Database error: #{e.message}"
            response.status = 500
            { error: "Database error: #{e.message}" }
          rescue StandardError => e
            LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - #{e.message}"
            response.status = 500
            { error: "Internal server error: #{e.message}" }
          end
        end

        r.post "password-reset" do
          begin
            timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
            request_body = r.body.read
            LOGGER.info "[#{timestamp}] POST /api/v1/employees/password-reset called with body: #{request_body}"
            payload = JSON.parse(request_body)
            employee_id = payload["employee_id"]&.upcase
            official_email = payload["official_email"]&.downcase

            unless employee_id && official_email
              LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Missing employee_id or official_email"
              response.status = 400
              return { error: "Missing employee_id or official_email" }
            end

            employee = DB[:employees].where(employee_id: employee_id, official_email: official_email).first
            unless employee
              LOGGER.info "[#{timestamp}] Response: 404 Not Found - No account found with this employee ID and email"
              response.status = 404
              return { error: "No account found with this employee ID and email" }
            end

            reset_token = SecureRandom.urlsafe_base64(32)
            generated_password = SecureRandom.alphanumeric(12)
            expires_at = Time.now + 3600
            DB[:password_resets].insert(
              employee_id: employee_id,
              reset_token: reset_token,
              expires_at: expires_at,
              created_at: Time.now
            )

            reset_link = "http://localhost:5173/reset-password?token=#{reset_token}&password=#{generated_password}"
            
            LOGGER.info "[#{timestamp}] Response: 200 OK - Reset link generated for #{official_email}: #{reset_link}"
            { success: true, message: "Password reset link generated", reset_link: reset_link, generated_password: generated_password }
          rescue JSON::ParserError
            LOGGER.error "[#{timestamp}] Response: 400 Bad Request - Invalid JSON payload"
            response.status = 400
            { error: "Invalid JSON payload" }
          rescue => e
            LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - #{e.message}"
            response.status = 500
            { error: "Failed to generate reset link: #{e.message}" }
          end
        end

        r.post "password-reset/confirm" do
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          begin
            request_body = r.body.read
            LOGGER.info "[#{timestamp}] POST /api/v1/employees/password-reset/confirm called with body: #{request_body}"
            data = JSON.parse(request_body, symbolize_names: true)
            token = data[:token]&.strip
            new_password = data[:new_password]&.strip

            missing_fields = [:token, :new_password].reject { |k| data[k] && !data[k].to_s.strip.empty? }
            if missing_fields.any?
              LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Missing fields: #{missing_fields.join(', ')}"
              response.status = 400
              return { error: "Missing required fields: #{missing_fields.join(', ')}" }
            end

            unless new_password.length >= 8
              LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Password too short"
              response.status = 400
              return { error: "New password must be at least 8 characters long" }
            end

            reset = DB[:password_resets].where(reset_token: token).first
            unless reset
              LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Invalid or expired token"
              response.status = 400
              return { error: "Invalid or expired reset token" }
            end

            if reset[:expires_at] <= TZInfo::Timezone.get('Asia/Kolkata').now
              LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Token expired"
              response.status = 400
              return { error: "Reset token has expired" }
            end

            hashed_password = BCrypt::Password.create(new_password)
            DB[:employees].where(employee_id: reset[:employee_id]).update(password: hashed_password)
            DB[:password_resets].where(reset_token: token).delete

            employee = DB[:employees].where(employee_id: reset[:employee_id]).first

            LOGGER.info "[#{timestamp}] Response: 200 OK - Password reset successful for employee_id: #{reset[:employee_id]}"
            response.status = 200
            { 
              success: true, 
              message: "Password has been reset successfully", 
              user: { 
                employee_id: employee[:employee_id], 
                official_email: employee[:official_email] 
              }
            }
          rescue JSON::ParserError => e
            LOGGER.error "[#{timestamp}] Response: 400 Bad Request - Invalid JSON: #{e.message}"
            response.status = 400
            { error: "Invalid JSON: #{e.message}" }
          rescue Sequel::DatabaseError => e
            LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - Database error: #{e.message}"
            response.status = 500
            { error: "Database error: #{e.message}" }
          rescue StandardError => e
            LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - Unexpected error: #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
            response.status = 500
            { error: "Internal server error: #{e.message}" }
          end
        end
      end

      r.on "leave-requests" do
        leaves = DB[:employees].join(:leaves, employee_id: :employee_id)

        r.get do
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          LOGGER.info "[#{timestamp}] GET /api/v1/leave-requests called"
          employee_id = r.session[:employee_id]
          LOGGER.info "[#{timestamp}] Session employee_id: #{employee_id.inspect}"
          unless employee_id
            LOGGER.info "[#{timestamp}] Response: 401 Unauthorized - No session"
            response.status = 401
            return { error: "Unauthorized: Please log in" }
          end
          begin
            leave_requests = leaves.where(employee_id: employee_id).order(Sequel.desc(:created_at)).select(
              :id, :employee_id, :leave_type, :day_type, :reason, :start_date, :end_date, :duration, :status, :submitted_at, :created_at, :updated_at
            ).all
            LOGGER.info "[#{timestamp}] Response: 200 OK - #{leave_requests.length} leave requests returned"
            leave_requests
          rescue StandardError => e
            LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
            response.status = 500
            { error: "Internal server error: #{e.message}" }
          end
        end

        r.post do
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          begin
            request_body = r.body.read
            LOGGER.info "[#{timestamp}] POST /api/v1/leave-requests called with body: #{request_body}"
            data = JSON.parse(request_body)
            required = %w[leaveType dayType reason startDate endDate status submittedAt]
            unless required.all? { |k| data[k].is_a?(String) && !data[k].strip.empty? } && data["duration"]
              LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Missing or invalid required fields"
              response.status = 400
              return { error: "Missing or invalid required fields" }
            end

            employee_id = r.session[:employee_id]
            unless employee_id
              LOGGER.info "[#{timestamp}] Response: 401 Unauthorized - No session"
              response.status = 401
              return { error: "Unauthorized: Please log in" }
            end

            id = DB[:leaves].insert(
              employee_id: employee_id,
              leave_type: data["leaveType"],
              day_type: data["dayType"],
              reason: data["reason"],
              start_date: data["startDate"],
              end_date: data["endDate"],
              duration: data["duration"],
              status: data["status"],
              submitted_at: data["submittedAt"],
              updated_at: TZInfo::Timezone.get('Asia/Kolkata').now,
              created_at: TZInfo::Timezone.get('Asia/Kolkata').now
            )

            LOGGER.info "[#{timestamp}] Response: 201 Created - Leave request created with ID: #{id}"
            response.status = 201
            DB[:leaves].where(id: id).first
          rescue JSON::ParserError => e
            LOGGER.error "[#{timestamp}] Response: 400 Bad Request - Invalid JSON: #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
            response.status = 400
            { error: "Invalid JSON: #{e.message}" }
          rescue Sequel::DatabaseError => e
            LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - Database error: #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
            response.status = 500
            { error: "Database error: #{e.message}" }
          rescue StandardError => e
            LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
            response.status = 500
            { error: "Internal server error: #{e.message}" }
          end
        end

        r.on Integer do |id|
          r.patch do
            timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
            begin
              request_body = r.body.read
              LOGGER.info "[#{timestamp}] PATCH /api/v1/leave-requests/#{id} called with body: #{request_body}"
              data = JSON.parse(request_body)
              status = data["status"]
              unless %w[Pending Approved Rejected].include?(status)
                LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Invalid status"
                response.status = 400
                return { error: "Invalid status" }
              end

              employee_id = r.session[:employee_id]
              unless employee_id
                LOGGER.info "[#{timestamp}] Response: 401 Unauthorized - No session"
                response.status = 401
                return { error: "Unauthorized: Please log in" }
              end

              leave = DB[:leaves].where(id: id, employee_id: employee_id).first
              unless leave
                LOGGER.info "[#{timestamp}] Response: 404 Not Found - Leave request not found or unauthorized"
                response.status = 404
                return { error: "Leave request not found or you are not authorized to modify it" }
              end

              updated = DB[:leaves].where(id: id).update(status: data["status"], updated_at: TZInfo::Timezone.get('Asia/Kolkata').now)
              if updated > 0
                LOGGER.info "[#{timestamp}] Response: 200 OK - Leave request updated"
                { success: true }
              else
                LOGGER.info "[#{timestamp}] Response: 404 Not Found"
                response.status = 404
                { error: "Leave request not found" }
              end
            rescue JSON::ParserError => e
              LOGGER.error "[#{timestamp}] Response: 400 Bad Request - Invalid JSON: #{e.message}"
              response.status = 400
              { error: "Invalid JSON: #{e.message}" }
            rescue StandardError => e
              LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
              response.status = 500
              { error: "Internal server error: #{e.message}" }
            end
          end

          r.delete do
            timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
            begin
              LOGGER.info "[#{timestamp}] DELETE /api/v1/leave-requests/#{id} called"
              employee_id = r.session[:employee_id]
              unless employee_id
                LOGGER.info "[#{timestamp}] Response: 401 Unauthorized - No session"
                response.status = 401
                return { error: "Unauthorized: Please log in" }
              end

              leave = DB[:leaves].where(id: id, employee_id: employee_id).first
              unless leave
                LOGGER.info "[#{timestamp}] Response: 404 Not Found - Leave request not found or unauthorized"
                response.status = 404
                return { error: "Leave request not found or you are not authorized to delete it" }
              end

              deleted = DB[:leaves].where(id: id).delete
              if deleted > 0
                LOGGER.info "[#{timestamp}] Response: 200 OK - Leave request deleted"
                { success: true }
              else
                LOGGER.info "[#{timestamp}] Response: 404 Not Found"
                response.status = 404
                { error: "Leave request not found" }
              end
            rescue StandardError => e
              LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
              response.status = 500
              { error: "Internal server error: #{e.message}" }
            end
          end
        end
      end

      r.on "announcements" do
        r.get do
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          LOGGER.info "[#{timestamp}] GET /api/v1/announcements called"
          announcements = DB[:announcements].order(Sequel.desc(:created_at)).map do |a|
            {
              id: a[:id],
              title: a[:title],
              description: a[:description],
              posted: TZInfo::Timezone.get('Asia/Kolkata').local_to_utc(a[:created_at]).iso8601
            }
          end
          LOGGER.info "[#{timestamp}] Response: 200 OK - #{announcements.length} announcements returned"
          announcements
        end

        r.post do
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          begin
            request_body = r.body.read
            LOGGER.info "[#{timestamp}] POST /api/v1/announcements called with body: #{request_body}"
            data = JSON.parse(request_body)
            title, description = data.values_at("title", "description")
            unless title && description && !title.strip.empty? && !description.strip.empty?
              LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Missing title or description"
              response.status = 400
              return { error: "Missing or empty title or description" }
            end
            now = TZInfo::Timezone.get('Asia/Kolkata').now
            id = DB[:announcements].insert(title: title.strip, description: description.strip, created_at: now)
            LOGGER.info "[#{timestamp}] Response: 201 Created - Announcement created with ID: #{id}"
            response.status = 201
            { id: id, title: title.strip, description: description.strip, posted: now.iso8601 }
          rescue JSON::ParserError => e
            LOGGER.error "[#{timestamp}] Response: 400 Bad Request - Invalid JSON: #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
            response.status = 400
            { error: "Invalid JSON: #{e.message}" }
          rescue Sequel::DatabaseError => e
            LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - Database error: #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
            response.status = 500
            { error: "Database error: #{e.message}" }
          rescue StandardError => e
            LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - Unexpected error: #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
            response.status = 500
            { error: "Internal server error: #{e.message}" }
          end
        end
      end

      r.on "policies" do
        r.get do
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          LOGGER.info "[#{timestamp}] GET /api/v1/policies called"
          policies = DB[:company_policies].order(Sequel.desc(:created_at)).map do |policy|
            {
              id: policy[:id],
              title: policy[:title],
              file_name: policy[:file_name],
              file_url: "http://localhost:9292#{policy[:file_path]}",
              is_hidden: policy[:is_hidden],
              created_at: TZInfo::Timezone.get('Asia/Kolkata').local_to_utc(policy[:created_at]).iso8601
            }
          end
          LOGGER.info "[#{timestamp}] Response: 200 OK - #{policies.length} policies returned"
          policies
        end

        r.post do
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          begin
            LOGGER.info "[#{timestamp}] POST /api/v1/policies called with params: #{r.params.inspect}"
            title = r.params['title']
            file = r.params['file']
            unless title && file && !title.strip.empty?
              LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Missing title or file"
              response.status = 400
              return { error: 'Missing or empty title or file' }
            end

            allowed_exts = ['.pdf', '.doc', '.docx']
            ext = File.extname(file[:filename]).downcase
            unless allowed_exts.include?(ext)
              LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Invalid file type: #{ext}"
              response.status = 400
              return { error: "Only PDF, DOC, and DOCX files are allowed" }
            end

            begin
              file_size = File.size(file[:tempfile])
            rescue => e
              LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Cannot determine file size: #{e.message}"
              response.status = 400
              return { error: 'Cannot determine file size' }
            end

            if file_size > 10 * 1024 * 1024
              LOGGER.info "[#{timestamp}] Response: 400 Bad Request - File size exceeds 10MB"
              response.status = 400
              return { error: "File size exceeds 10MB limit" }
            end

            uploads_dir = File.expand_path("public/uploads", __dir__)
            FileUtils.mkdir_p(uploads_dir)
            sanitized_name = file[:filename].gsub(/[^\w\.\-]/, '_')
            new_filename = "#{Time.now.to_i}_#{sanitized_name}"
            file_path = File.join(uploads_dir, new_filename)
            File.open(file_path, 'wb') { |f| f.write(file[:tempfile].read) }

            id = DB[:company_policies].insert(
              title: title.strip,
              file_name: file[:filename],
              file_path: "/uploads/#{new_filename}",
              is_hidden: false,
              created_at: TZInfo::Timezone.get('Asia/Kolkata').now
            )

            LOGGER.info "[#{timestamp}] Response: 201 Created - Policy created with ID: #{id}"
            response.status = 201
            { success: true, id: id }
          rescue StandardError => e
            LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
            response.status = 500
            { error: "Internal server error: #{e.message}" }
          end
        end

        r.on Integer do |id|
          r.patch "hide" do
            timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
            begin
              LOGGER.info "[#{timestamp}] PATCH /api/v1/policies/#{id}/hide called"
              row = DB[:company_policies][id: id]
              unless row
                LOGGER.info "[#{timestamp}] Response: 404 Not Found - Policy not found"
                response.status = 404
                return { error: 'Policy not found' }
              end

              DB[:company_policies].where(id: id).update(is_hidden: !row[:is_hidden])
              LOGGER.info "[#{timestamp}] Response: 200 OK - Policy hidden status updated"
              { success: true }
            rescue StandardError => e
              LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
              response.status = 500
              { error: "Internal server error: #{e.message}" }
            end
          end

          r.patch "file" do
            timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
            begin
              LOGGER.info "[#{timestamp}] PATCH /api/v1/policies/#{id}/file called with params: #{r.params.inspect}"
              file = r.params['file']
              unless file
                LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Missing file"
                response.status = 400
                return { error: 'Missing file' }
              end

              begin
                file_size = File.size(file[:tempfile])
              rescue => e
                LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Cannot determine file size: #{e.message}"
                response.status = 400
                return { error: 'Cannot determine file size' }
              end

              if file_size > 10 * 1024 * 1024
                LOGGER.info "[#{timestamp}] Response: 400 Bad Request - File size exceeds 10MB"
                response.status = 400
                return { error: "File size exceeds 10MB limit" }
              end

              uploads_dir = File.expand_path("public/uploads")
              FileUtils.mkdir_p(uploads_dir)
              file_path = File.join(uploads_dir, "#{Time.now.to_i}_#{file[:filename]}")
              File.open(file_path, 'wb') { |f| f.write(file[:tempfile].read) }

              DB[:company_policies].where(id: id).update(
                file_name: file[:filename],
                file_path: "/uploads/#{File.basename(file_path)}"
              )

              LOGGER.info "[#{timestamp}] Response: 200 OK - Policy file updated"
              { success: true }
            rescue StandardError => e
              LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
              response.status = 500
              { error: "Internal server error: #{e.message}" }
            end
          end
        end
      end

      r.on "benefits" do
        r.get do
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          LOGGER.info "[#{timestamp}] GET /api/v1/benefits called"
          benefits = DB[:benefits].order(Sequel.desc(:created_at)).map do |b|
            {
              id: b[:id],
              type: b[:type],
              file_name: b[:file_name],
              file_path: b[:file_path],
              file_url: "http://localhost:9292#{b[:file_path]}",
              created_at: TZInfo::Timezone.get('Asia/Kolkata').local_to_utc(b[:created_at]).iso8601
            }
          end
          LOGGER.info "[#{timestamp}] Response: 200 OK - #{benefits.length} benefits returned"
          benefits
        end

        r.post do
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          begin
            LOGGER.info "[#{timestamp}] POST /api/v1/benefits with params: #{r.params.inspect}"
            type = r.params['type']
            file = r.params['file']

            if !type || type.strip.empty?
              response.status = 400
              return { error: 'Missing or empty type' }
            end

            if !file
              response.status = 400
              return { error: 'Missing file' }
            end

            begin
              file_size = File.size(file[:tempfile])
            rescue => e
              response.status = 400
              return { error: 'Cannot determine file size' }
            end

            if file_size > 10 * 1024 * 1024
              response.status = 400
              return { error: "File size exceeds 10MB limit" }
            end

            allowed_exts = ['.pdf', '.docx']
            ext = File.extname(file[:filename]).downcase
            unless allowed_exts.include?(ext)
              response.status = 400
              return { error: "Only PDF and DOCX files are allowed" }
            end

            uploads_dir = File.expand_path("public/uploads", __dir__)
            FileUtils.mkdir_p(uploads_dir)
            sanitized_name = file[:filename].gsub(/[^\w\.\-]/, '_')
            new_filename = "#{Time.now.to_i}_#{sanitized_name}"
            file_path = File.join(uploads_dir, new_filename)
            File.open(file_path, 'wb') { |f| f.write(file[:tempfile].read) }

            id = DB[:benefits].insert(
              type: type.strip,
              file_name: file[:filename],
              file_path: "/uploads/#{new_filename}",
              created_at: TZInfo::Timezone.get('Asia/Kolkata').now
            )

            response.status = 201
            { success: true, id: id }
          rescue => e
            response.status = 500
            LOGGER.error "[#{timestamp}] Error: #{e.message}"
            { error: "Internal server error: #{e.message}" }
          end
        end
      end

      r.get "download", Integer do |id|
        timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
        begin
          LOGGER.info "[#{timestamp}] Download request for benefit ID: #{id}"
          record = DB[:benefits][id: id]
          unless record
            LOGGER.warn "[#{timestamp}] Benefit ID #{id} not found"
            response.status = 404
            return { error: "Benefit not found" }
          end

          full_path = File.expand_path("public#{record[:file_path]}", __dir__)
          unless File.exist?(full_path)
            LOGGER.warn "[#{timestamp}] File not found at path: #{full_path}"
            response.status = 404
            return { error: "File not found" }
          end

          response['Content-Type'] = 'application/octet-stream'
          response['Content-Disposition'] = "attachment; filename=\"#{record[:file_name]}\""
          File.read(full_path)
        rescue => e
          LOGGER.error "[#{timestamp}] Download failed: #{e.message}"
          response.status = 500
          { error: "Download failed: #{e.message}" }
        end
      end

      r.on "admin", "events" do
        events = DB[:events]

        r.get do
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          LOGGER.info "[#{timestamp}] GET /api/v1/admin/events called"
          events.order(Sequel.desc(:added_at)).all
        rescue StandardError => e
          LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
          response.status = 500
          { error: "Internal server error: #{e.message}" }
        end

        r.post do
          timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
          begin
            request_body = r.body.read
            LOGGER.info "[#{timestamp}] POST /api/v1/admin/events called with body: #{request_body}"
            data = JSON.parse(request_body)
            title, date = data.values_at("title", "date")
            unless title && date
              LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Missing title or date"
              response.status = 400
              return { error: "Missing title or date" }
            end

            id = events.insert(title: title, date: date, added_at: TZInfo::Timezone.get('Asia/Kolkata').now)
            LOGGER.info "[#{timestamp}] Response: 201 Created - Event created with ID: #{id}"
            response.status = 201
            events.where(id: id).first
          rescue JSON::ParserError => e
            LOGGER.error "[#{timestamp}] Response: 400 Bad Request - Invalid JSON: #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
            response.status = 400
            { error: "Invalid JSON: #{e.message}" }
          rescue StandardError => e
            LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
            response.status = 500
            { error: "Internal server error: #{e.message}" }
          end
        end

        r.on Integer do |id|
          r.put do
            timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
            begin
              request_body = r.body.read
              LOGGER.info "[#{timestamp}] PUT /api/v1/admin/events/#{id} called with body: #{request_body}"
              data = JSON.parse(request_body)
              title, date = data.values_at("title", "date")
              unless title && date
                LOGGER.info "[#{timestamp}] Response: 400 Bad Request - Missing title or date"
                response.status = 400
                return { error: "Missing title or date" }
              end
              updated = events.where(id: id).update(title: title, date: date, added_at: TZInfo::Timezone.get('Asia/Kolkata').now)
              if updated > 0
                LOGGER.info "[#{timestamp}] Response: 200 OK - Event updated"
                { message: "Event updated" }
              else
                LOGGER.info "[#{timestamp}] Response: 404 Not Found"
                response.status = 404
                { error: "Not found" }
              end
            rescue JSON::ParserError => e
              LOGGER.error "[#{timestamp}] Response: 400 Bad Request - Invalid JSON: #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
              response.status = 400
              { error: "Invalid JSON: #{e.message}" }
            rescue StandardError => e
              LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
              response.status = 500
              { error: "Internal server error: #{e.message}" }
            end
          end

          r.delete do
            timestamp = TZInfo::Timezone.get('Asia/Kolkata').now.iso8601
            begin
              LOGGER.info "[#{timestamp}] DELETE /api/v1/admin/events/#{id} called"
              deleted = events.where(id: id).delete
              if deleted > 0
                LOGGER.info "[#{timestamp}] Response: 200 OK - Event deleted"
                { success: true }
              else
                LOGGER.info "[#{timestamp}] Response: 404 Not Found"
                response.status = 404
                { error: "Not found" }
              end
            rescue StandardError => e
              LOGGER.error "[#{timestamp}] Response: 500 Internal Server Error - #{e.message} (Backtrace: #{e.backtrace.join("\n")})"
              response.status = 500
              { error: "Internal server error: #{e.message}" }
            end
          end
        end
      end
    end
  end
end