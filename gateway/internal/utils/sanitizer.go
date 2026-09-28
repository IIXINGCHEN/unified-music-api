package utils

import (
	"fmt"
	"reflect"
	"strings"
)

// SensitiveFields 敏感字段列表 - 生产环境完整版本
var SensitiveFields = []string{
	// 认证相关
	"password", "passwd", "pwd", "secret", "key", "token", "auth", "credential",
	"jwt_secret", "jwt_key", "api_key", "admin_key", "private_key", "public_key",
	"access_token", "refresh_token", "session_key", "session_secret",

	// 证书相关
	"cert", "certificate", "cert_file", "key_file", "tls_cert_file", "tls_key_file",
	"ssl_cert", "ssl_key", "ca_cert", "ca_key", "client_cert", "client_key",

	// 数据库相关
	"database", "db", "redis", "mysql", "postgres", "mongodb", "sqlite",
	"dsn", "connection_string", "conn_str", "db_url", "database_url",
	"username", "user", "host", "hostname", "port",

	// 云服务相关
	"aws_access_key", "aws_secret_key", "azure_key", "gcp_key",
	"s3_key", "s3_secret", "bucket_key", "storage_key",

	// 第三方服务
	"smtp_password", "email_password", "mail_password",
	"webhook_secret", "callback_secret", "signing_secret",

	// 系统相关
	"encryption_key", "cipher_key", "hash_key", "salt",
	"license_key", "activation_key", "registration_key",
}

// SensitivePatterns 敏感模式匹配
var SensitivePatterns = []string{
	"*key*", "*secret*", "*password*", "*token*", "*auth*",
	"*cert*", "*credential*", "*private*", "*confidential*",
}

// AlwaysHideFields 始终隐藏的字段（即使为空）
var AlwaysHideFields = []string{
	"jwt_secret", "admin_key", "api_key", "private_key",
	"database", "redis", "mysql", "postgres",
}

// SanitizeConfig 脱敏配置信息
func SanitizeConfig(config interface{}) interface{} {
	return sanitizeValue(reflect.ValueOf(config))
}

// sanitizeValue 递归脱敏值
func sanitizeValue(v reflect.Value) interface{} {
	if !v.IsValid() {
		return nil
	}

	switch v.Kind() {
	case reflect.Ptr:
		if v.IsNil() {
			return nil
		}
		return sanitizeValue(v.Elem())
	
	case reflect.Interface:
		if v.IsNil() {
			return nil
		}
		return sanitizeValue(v.Elem())
	
	case reflect.Struct:
		result := make(map[string]interface{})
		t := v.Type()
		for i := 0; i < v.NumField(); i++ {
			field := t.Field(i)
			fieldValue := v.Field(i)
			
			// 跳过未导出的字段
			if !fieldValue.CanInterface() {
				continue
			}
			
			fieldName := getJSONFieldName(field)
			if isSensitiveField(fieldName) {
				result[fieldName] = maskSensitiveValue(fieldValue)
			} else {
				result[fieldName] = sanitizeValue(fieldValue)
			}
		}
		return result
	
	case reflect.Map:
		result := make(map[string]interface{})
		for _, key := range v.MapKeys() {
			keyStr := key.String()
			mapValue := v.MapIndex(key)
			
			if isSensitiveField(keyStr) {
				result[keyStr] = maskSensitiveValue(mapValue)
			} else {
				result[keyStr] = sanitizeValue(mapValue)
			}
		}
		return result
	
	case reflect.Slice, reflect.Array:
		result := make([]interface{}, v.Len())
		for i := 0; i < v.Len(); i++ {
			result[i] = sanitizeValue(v.Index(i))
		}
		return result
	
	default:
		return v.Interface()
	}
}

// getJSONFieldName 获取JSON字段名
func getJSONFieldName(field reflect.StructField) string {
	tag := field.Tag.Get("json")
	if tag == "" {
		return strings.ToLower(field.Name)
	}
	
	// 处理 json:"field_name,omitempty" 格式
	parts := strings.Split(tag, ",")
	if parts[0] == "-" {
		return ""
	}
	
	if parts[0] != "" {
		return parts[0]
	}
	
	return strings.ToLower(field.Name)
}

// isSensitiveField 检查是否为敏感字段
func isSensitiveField(fieldName string) bool {
	if fieldName == "" {
		return false
	}

	fieldLower := strings.ToLower(fieldName)

	// 检查是否在始终隐藏列表中
	for _, alwaysHide := range AlwaysHideFields {
		if strings.Contains(fieldLower, alwaysHide) {
			return true
		}
	}

	// 检查精确匹配
	for _, sensitive := range SensitiveFields {
		if fieldLower == sensitive || strings.Contains(fieldLower, sensitive) {
			return true
		}
	}

	// 检查模式匹配
	for _, pattern := range SensitivePatterns {
		if matchPattern(fieldLower, pattern) {
			return true
		}
	}

	// 检查常见敏感字段后缀
	sensitiveSuffixes := []string{"_key", "_secret", "_password", "_token", "_auth"}
	for _, suffix := range sensitiveSuffixes {
		if strings.HasSuffix(fieldLower, suffix) {
			return true
		}
	}

	// 检查常见敏感字段前缀
	sensitivePrefixes := []string{"secret_", "private_", "auth_", "key_", "token_"}
	for _, prefix := range sensitivePrefixes {
		if strings.HasPrefix(fieldLower, prefix) {
			return true
		}
	}

	return false
}

// matchPattern 简单的通配符模式匹配
func matchPattern(text, pattern string) bool {
	if pattern == "*" {
		return true
	}

	if strings.HasPrefix(pattern, "*") && strings.HasSuffix(pattern, "*") {
		// *keyword* 格式
		keyword := strings.Trim(pattern, "*")
		return strings.Contains(text, keyword)
	}

	if strings.HasPrefix(pattern, "*") {
		// *suffix 格式
		suffix := strings.TrimPrefix(pattern, "*")
		return strings.HasSuffix(text, suffix)
	}

	if strings.HasSuffix(pattern, "*") {
		// prefix* 格式
		prefix := strings.TrimSuffix(pattern, "*")
		return strings.HasPrefix(text, prefix)
	}

	// 精确匹配
	return text == pattern
}

// maskSensitiveValue 掩码敏感值
func maskSensitiveValue(v reflect.Value) interface{} {
	if !v.IsValid() {
		return nil
	}
	
	switch v.Kind() {
	case reflect.String:
		str := v.String()
		if str == "" {
			return ""
		}
		return maskString(str)
	
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		if v.Int() == 0 {
			return 0
		}
		return "***"
	
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		if v.Uint() == 0 {
			return 0
		}
		return "***"
	
	default:
		return "***"
	}
}

// maskString 掩码字符串 - 生产环境安全版本
func maskString(s string) string {
	if len(s) == 0 {
		return "[EMPTY]"
	}

	// 对于非常短的字符串，完全隐藏
	if len(s) <= 2 {
		return "[HIDDEN]"
	}

	// 对于短字符串，只显示长度
	if len(s) <= 6 {
		return fmt.Sprintf("[HIDDEN_%d_CHARS]", len(s))
	}

	// 对于中等长度字符串，显示前后各1位
	if len(s) <= 12 {
		return s[:1] + strings.Repeat("*", len(s)-2) + s[len(s)-1:]
	}

	// 对于长字符串，显示前后各2位
	if len(s) <= 32 {
		return s[:2] + strings.Repeat("*", len(s)-4) + s[len(s)-2:]
	}

	// 对于非常长的字符串，显示前后各3位，并标注长度
	return fmt.Sprintf("%s%s%s[%d]",
		s[:3],
		strings.Repeat("*", 10),
		s[len(s)-3:],
		len(s))
}

// SanitizeForProduction 生产环境专用脱敏函数
func SanitizeForProduction(config interface{}) interface{} {
	return sanitizeValueForProduction(reflect.ValueOf(config))
}

// sanitizeValueForProduction 生产环境递归脱敏
func sanitizeValueForProduction(v reflect.Value) interface{} {
	if !v.IsValid() {
		return nil
	}

	switch v.Kind() {
	case reflect.Ptr:
		if v.IsNil() {
			return nil
		}
		return sanitizeValueForProduction(v.Elem())

	case reflect.Interface:
		if v.IsNil() {
			return nil
		}
		return sanitizeValueForProduction(v.Elem())

	case reflect.Struct:
		result := make(map[string]interface{})
		t := v.Type()
		for i := 0; i < v.NumField(); i++ {
			field := t.Field(i)
			fieldValue := v.Field(i)

			// 跳过未导出的字段
			if !fieldValue.CanInterface() {
				continue
			}

			fieldName := getJSONFieldName(field)
			if fieldName == "" {
				continue
			}

			if isSensitiveField(fieldName) {
				// 生产环境完全隐藏敏感字段
				result[fieldName] = "[REDACTED_FOR_SECURITY]"
			} else if isSystemInternalField(fieldName) {
				// 系统内部字段也要隐藏
				result[fieldName] = "[SYSTEM_INTERNAL]"
			} else {
				result[fieldName] = sanitizeValueForProduction(fieldValue)
			}
		}
		return result

	case reflect.Map:
		result := make(map[string]interface{})
		for _, key := range v.MapKeys() {
			keyStr := key.String()
			mapValue := v.MapIndex(key)

			if isSensitiveField(keyStr) {
				result[keyStr] = "[REDACTED_FOR_SECURITY]"
			} else if isSystemInternalField(keyStr) {
				result[keyStr] = "[SYSTEM_INTERNAL]"
			} else {
				result[keyStr] = sanitizeValueForProduction(mapValue)
			}
		}
		return result

	case reflect.Slice, reflect.Array:
		result := make([]interface{}, v.Len())
		for i := 0; i < v.Len(); i++ {
			result[i] = sanitizeValueForProduction(v.Index(i))
		}
		return result

	default:
		return v.Interface()
	}
}

// isSystemInternalField 检查是否为系统内部字段
func isSystemInternalField(fieldName string) bool {
	internalFields := []string{
		"internal", "private", "system", "debug", "trace",
		"log_file", "pid_file", "socket_file", "temp_dir",
		"working_dir", "home_dir", "config_dir",
	}

	fieldLower := strings.ToLower(fieldName)
	for _, internal := range internalFields {
		if strings.Contains(fieldLower, internal) {
			return true
		}
	}

	return false
}
