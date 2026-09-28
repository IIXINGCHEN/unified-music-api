// Package validator 提供参数验证功能
package validator

import (
	"fmt"
	"net/url"
	"regexp"
	"strconv"
	"strings"
)

// Validator 验证器接口
type Validator interface {
	Validate(value interface{}) error
}

// ValidationError 验证错误
type ValidationError struct {
	Field   string      `json:"field"`
	Message string      `json:"message"`
	Value   interface{} `json:"value,omitempty"`
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("字段 %s: %s", e.Field, e.Message)
}

// ValidationErrors 多个验证错误
type ValidationErrors []*ValidationError

func (e ValidationErrors) Error() string {
	if len(e) == 0 {
		return ""
	}

	var messages []string
	for _, err := range e {
		messages = append(messages, err.Error())
	}
	return strings.Join(messages, "; ")
}

// RequiredValidator 必填验证器
type RequiredValidator struct {
	Field string
}

func (v *RequiredValidator) Validate(value interface{}) error {
	if value == nil {
		return &ValidationError{
			Field:   v.Field,
			Message: "不能为空",
			Value:   value,
		}
	}

	switch val := value.(type) {
	case string:
		if strings.TrimSpace(val) == "" {
			return &ValidationError{
				Field:   v.Field,
				Message: "不能为空",
				Value:   value,
			}
		}
	case []string:
		if len(val) == 0 {
			return &ValidationError{
				Field:   v.Field,
				Message: "不能为空",
				Value:   value,
			}
		}
	}

	return nil
}

// LengthValidator 长度验证器
type LengthValidator struct {
	Field string
	Min   int
	Max   int
}

func (v *LengthValidator) Validate(value interface{}) error {
	var length int

	switch val := value.(type) {
	case string:
		length = len(val)
	case []string:
		length = len(val)
	default:
		return &ValidationError{
			Field:   v.Field,
			Message: "不支持的类型",
			Value:   value,
		}
	}

	if v.Min > 0 && length < v.Min {
		return &ValidationError{
			Field:   v.Field,
			Message: fmt.Sprintf("长度不能少于%d", v.Min),
			Value:   value,
		}
	}

	if v.Max > 0 && length > v.Max {
		return &ValidationError{
			Field:   v.Field,
			Message: fmt.Sprintf("长度不能超过%d", v.Max),
			Value:   value,
		}
	}

	return nil
}

// RangeValidator 范围验证器
type RangeValidator struct {
	Field string
	Min   int64
	Max   int64
}

func (v *RangeValidator) Validate(value interface{}) error {
	var num int64
	var err error

	switch val := value.(type) {
	case int:
		num = int64(val)
	case int64:
		num = val
	case string:
		num, err = strconv.ParseInt(val, 10, 64)
		if err != nil {
			return &ValidationError{
				Field:   v.Field,
				Message: "必须是数字",
				Value:   value,
			}
		}
	default:
		return &ValidationError{
			Field:   v.Field,
			Message: "不支持的类型",
			Value:   value,
		}
	}

	if v.Min != 0 && num < v.Min {
		return &ValidationError{
			Field:   v.Field,
			Message: fmt.Sprintf("不能小于%d", v.Min),
			Value:   value,
		}
	}

	if v.Max != 0 && num > v.Max {
		return &ValidationError{
			Field:   v.Field,
			Message: fmt.Sprintf("不能大于%d", v.Max),
			Value:   value,
		}
	}

	return nil
}

// RegexValidator 正则表达式验证器
type RegexValidator struct {
	Field   string
	Pattern string
	Message string
	regex   *regexp.Regexp
}

func (v *RegexValidator) Validate(value interface{}) error {
	if v.regex == nil {
		var err error
		v.regex, err = regexp.Compile(v.Pattern)
		if err != nil {
			return &ValidationError{
				Field:   v.Field,
				Message: "正则表达式无效",
				Value:   value,
			}
		}
	}

	str, ok := value.(string)
	if !ok {
		return &ValidationError{
			Field:   v.Field,
			Message: "必须是字符串",
			Value:   value,
		}
	}

	if !v.regex.MatchString(str) {
		message := v.Message
		if message == "" {
			message = "格式不正确"
		}
		return &ValidationError{
			Field:   v.Field,
			Message: message,
			Value:   value,
		}
	}

	return nil
}

// URLValidator URL验证器
type URLValidator struct {
	Field string
}

func (v *URLValidator) Validate(value interface{}) error {
	str, ok := value.(string)
	if !ok {
		return &ValidationError{
			Field:   v.Field,
			Message: "必须是字符串",
			Value:   value,
		}
	}

	if str == "" {
		return nil // 空值由RequiredValidator处理
	}

	_, err := url.Parse(str)
	if err != nil {
		return &ValidationError{
			Field:   v.Field,
			Message: "URL格式不正确",
			Value:   value,
		}
	}

	return nil
}

// InValidator 枚举值验证器
type InValidator struct {
	Field  string
	Values []string
}

func (v *InValidator) Validate(value interface{}) error {
	str, ok := value.(string)
	if !ok {
		return &ValidationError{
			Field:   v.Field,
			Message: "必须是字符串",
			Value:   value,
		}
	}

	for _, validValue := range v.Values {
		if str == validValue {
			return nil
		}
	}

	return &ValidationError{
		Field:   v.Field,
		Message: fmt.Sprintf("必须是以下值之一: %s", strings.Join(v.Values, ", ")),
		Value:   value,
	}
}

// FieldValidator 字段验证器
type FieldValidator struct {
	Field      string
	Validators []Validator
}

func (v *FieldValidator) Validate(value interface{}) error {
	var errors ValidationErrors

	for _, validator := range v.Validators {
		if err := validator.Validate(value); err != nil {
			if validationErr, ok := err.(*ValidationError); ok {
				errors = append(errors, validationErr)
			} else {
				errors = append(errors, &ValidationError{
					Field:   v.Field,
					Message: err.Error(),
					Value:   value,
				})
			}
		}
	}

	if len(errors) > 0 {
		return errors
	}

	return nil
}

// StructValidator 结构体验证器
type StructValidator struct {
	Fields map[string]*FieldValidator
}

func NewStructValidator() *StructValidator {
	return &StructValidator{
		Fields: make(map[string]*FieldValidator),
	}
}

func (v *StructValidator) AddField(field string, validators ...Validator) *StructValidator {
	v.Fields[field] = &FieldValidator{
		Field:      field,
		Validators: validators,
	}
	return v
}

func (v *StructValidator) Validate(data map[string]interface{}) error {
	var errors ValidationErrors

	for field, validator := range v.Fields {
		value, exists := data[field]
		if !exists {
			value = nil
		}

		if err := validator.Validate(value); err != nil {
			if validationErrors, ok := err.(ValidationErrors); ok {
				errors = append(errors, validationErrors...)
			} else if validationErr, ok := err.(*ValidationError); ok {
				errors = append(errors, validationErr)
			} else {
				errors = append(errors, &ValidationError{
					Field:   field,
					Message: err.Error(),
					Value:   value,
				})
			}
		}
	}

	if len(errors) > 0 {
		return errors
	}

	return nil
}

// 便捷函数
func Required(field string) *RequiredValidator {
	return &RequiredValidator{Field: field}
}

func Length(field string, min, max int) *LengthValidator {
	return &LengthValidator{Field: field, Min: min, Max: max}
}

func Range(field string, min, max int64) *RangeValidator {
	return &RangeValidator{Field: field, Min: min, Max: max}
}

func Regex(field, pattern, message string) *RegexValidator {
	return &RegexValidator{Field: field, Pattern: pattern, Message: message}
}

func URL(field string) *URLValidator {
	return &URLValidator{Field: field}
}

func In(field string, values ...string) *InValidator {
	return &InValidator{Field: field, Values: values}
}

// 预定义的验证器
var (
	// 音乐ID验证器
	MusicIDValidator = Regex("id", `^[a-zA-Z0-9_-]+$`, "音乐ID只能包含字母、数字、下划线和连字符")

	// 音质验证器
	QualityValidator = In("quality", "128", "192", "320", "740", "999")

	// 音源验证器
	SourceValidator = In("source", "kugou", "qq", "migu", "netease", "pyncmd", "kuwo", "bilibili", "youtube")
)
