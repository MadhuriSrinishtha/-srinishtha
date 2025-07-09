# routes/api_v1.rb
class ApiV1 < Roda
  plugin :json

  route do |r|
    r.on "api", "v1" do
      r.get "hello" do
        message = Message.first || Message.create(content: "Hello from Roda!")
        { message: message.content }
      end
    end
  end
end
