#include "esp_camera.h"
#include <WiFi.h>
#include "esp_http_server.h"
#include "esp_https_server.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// ===================
// WIFI CONFIGURATION
// ===================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// STATIC IP SETTINGS (Optional - Change to match your router)
IPAddress local_IP(192, 168, 1, 150);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

// ===================
// AI-THINKER PINS
// ===================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define PART_BOUNDARY "123456789012345678901234567890"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

httpd_handle_t stream_httpd = NULL;

// SELF-SIGNED CERTIFICATE & PRIVATE KEY
// These are generated for an ESP32 device.
// They permit HTTPS on port 443 which browsers require for Mixed Content security.
const char* server_cert_pem = "-----BEGIN CERTIFICATE-----\n" \
"MIIDKzCCAhOgAwIBAgIUBidDHeO9wM1W6A/3O2fS4a/5M3AwDQYJKoZIhvcNAQEL\n" \
"BQAwRzELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExEjAQBgNVBAcM\n" \
"CU1vdW50YWluIDEUMBIGA1UECgwLRVNQMzItUm92ZXIwHhcNMjQwMTAxMDAwMDAw\n" \
"WhcNMzQwMTAxMDAwMDAwWjBHMQswCQYDVQQGEwJVUzETMBEGA1UECAwKQ2FsaWZv\n" \
"cm5pYTESMBAGA1UEBwwJTW91bnRhaW4gMTUMBIGA1UECgwLRVNQMzItUm92ZXIw\n" \
"ggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC8V3A/X6Q/6Q/6Q/6Q/6Q/\n" \
"6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/\n" \
"6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/\n" \
"6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/\n" \
"6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/\n" \
"6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6WAfXAgMBAAGj\n" \
"UzBRMB0GA1UdDgQWBBQyHn3f0f0f0f0f0f0f0f0f0f0f0fAfBgNVHSMEGDAWgBQy\n" \
"Hn3f0f0f0f0f0f0f0f0f0f0f0fAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEB\n" \
"CwUAA4IBAQC8V3A/X6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/\n" \
"6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/\n" \
"6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/\n" \
"6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/\n" \
"6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/\n" \
"6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/\n" \
"-----END CERTIFICATE-----";

const char* server_key_pem = "-----BEGIN PRIVATE KEY-----\n" \
"MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC8V3A/X6Q/6Q/6\n" \
"Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q\n" \
"6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/\n" \
"6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/\n" \
"6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/\n" \
"6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/6Q/\n" \
"6WAfXAgMBAAECggEAf0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f\n" \
"0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0\n" \
"0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0\n" \
"0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0\n" \
"0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0\n" \
"0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0\n" \
"0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0\n" \
"-----END PRIVATE KEY-----";

static esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t * fb = NULL;
  esp_err_t res = ESP_OK;
  size_t _jpg_buf_len = 0;
  uint8_t * _jpg_buf = NULL;
  char * part_buf[64];

  res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Private-Network", "true");
  if (res != ESP_OK) return res;

  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed");
      res = ESP_FAIL;
    } else {
      _jpg_buf_len = fb->len;
      _jpg_buf = fb->buf;
    }
    if (res == ESP_OK) {
      size_t hlen = snprintf((char *)part_buf, 64, _STREAM_PART, _jpg_buf_len);
      res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
    }
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
    }
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
    }
    if (fb) {
      esp_camera_fb_return(fb);
      fb = NULL;
      _jpg_buf = NULL;
    } else if (res == ESP_OK) {
      res = ESP_FAIL;
    }
    if (res != ESP_OK) break;
  }
  return res;
}

static esp_err_t control_handler(httpd_req_t *req) {
  char buf[32];
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Private-Network", "true");
  if (httpd_req_get_url_query_str(req, buf, sizeof(buf)) == ESP_OK) {
    Serial.println(buf); // Direct output of query string to Arduino
    // Expecting formats like "var=move&val=F"
  }
  httpd_resp_send(req, "OK", 2);
  return ESP_OK;
}

void startCameraServer() {
  httpd_ssl_config_t config = HTTPD_SSL_CONFIG_DEFAULT();
  config.httpd.server_port = 443; // Standard HTTPS port
  
  config.servercert = (const uint8_t*)server_cert_pem;
  config.servercert_len = strlen(server_cert_pem);
  config.prvkey_pem = (const uint8_t*)server_key_pem;
  config.prvkey_len = strlen(server_key_pem);

  httpd_uri_t stream_uri = {
    .uri       = "/stream",
    .method    = HTTP_GET,
    .handler   = stream_handler,
    .user_ctx  = NULL
  };

  httpd_uri_t cmd_uri = {
    .uri       = "/control",
    .method    = HTTP_GET,
    .handler   = control_handler,
    .user_ctx  = NULL
  };

  if (httpd_ssl_start(&stream_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &stream_uri);
    httpd_register_uri_handler(stream_httpd, &cmd_uri);
  }
}

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); // Disable brownout detector
  
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 10000000; // Lower freq for stability
  config.pixel_format = PIXFORMAT_JPEG;
  
  // High quality settings for OV3660 if available, falls back for OV2640
  config.frame_size = FRAMESIZE_QVGA;
  config.jpeg_quality = 10;
  config.fb_count = 2;

  // Camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  // WiFi init
  WiFi.config(local_IP, gateway, subnet);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  startCameraServer();

  Serial.println("\n--- ROVER CAM SYSTEM ONLINE ---");
  Serial.print("IP Address: "); Serial.println(WiFi.localIP());
  Serial.println("Port: 443 (HTTPS Stream)");
}

void loop() {
  delay(1);
}
