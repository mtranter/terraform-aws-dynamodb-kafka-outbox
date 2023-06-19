data "archive_file" "lambda_layer_payload" {
  type        = "zip"
  source_file  = "${path.module}/../lib/layer/handler.js"
  output_path = "${path.module}/lambda_layer_payload.zip"
} 

resource "aws_lambda_layer_version" "lambda_layer" {    
  filename   = "lambda_layer_payload.zip"
  layer_name = "lambda_layer_name"

  compatible_runtimes = ["nodejs18.x"]
}
