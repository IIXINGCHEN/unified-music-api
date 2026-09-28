// Package encoding 编码处理工具
package encoding

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"unicode/utf8"

	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
)

// CharsetDetector 字符集检测器
type CharsetDetector struct{}

// NewCharsetDetector 创建字符集检测器
func NewCharsetDetector() *CharsetDetector {
	return &CharsetDetector{}
}

// DetectAndDecode 检测并解码字符串
func (cd *CharsetDetector) DetectAndDecode(data []byte) (string, error) {
	// 首先检查是否已经是有效的UTF-8
	if utf8.Valid(data) {
		return string(data), nil
	}

	// 尝试GBK解码
	if decoded, err := cd.decodeGBK(data); err == nil {
		if utf8.ValidString(decoded) {
			return decoded, nil
		}
	}

	// 尝试GB18030解码
	if decoded, err := cd.decodeGB18030(data); err == nil {
		if utf8.ValidString(decoded) {
			return decoded, nil
		}
	}

	// 如果都失败了，返回原始字符串（可能包含乱码）
	return string(data), nil
}

// decodeGBK GBK解码
func (cd *CharsetDetector) decodeGBK(data []byte) (string, error) {
	reader := transform.NewReader(bytes.NewReader(data), simplifiedchinese.GBK.NewDecoder())
	decoded, err := io.ReadAll(reader)
	if err != nil {
		return "", err
	}
	return string(decoded), nil
}

// decodeGB18030 GB18030解码
func (cd *CharsetDetector) decodeGB18030(data []byte) (string, error) {
	reader := transform.NewReader(bytes.NewReader(data), simplifiedchinese.GB18030.NewDecoder())
	decoded, err := io.ReadAll(reader)
	if err != nil {
		return "", err
	}
	return string(decoded), nil
}

// HTTPResponseDecoder HTTP响应解码器
type HTTPResponseDecoder struct {
	detector *CharsetDetector
}

// NewHTTPResponseDecoder 创建HTTP响应解码器
func NewHTTPResponseDecoder() *HTTPResponseDecoder {
	return &HTTPResponseDecoder{
		detector: NewCharsetDetector(),
	}
}

// DecodeResponse 解码HTTP响应
func (hrd *HTTPResponseDecoder) DecodeResponse(resp *http.Response) ([]byte, error) {
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// 检查Content-Type头
	contentType := resp.Header.Get("Content-Type")
	if strings.Contains(strings.ToLower(contentType), "charset=") {
		// 如果指定了字符集，尝试按指定字符集解码
		if strings.Contains(strings.ToLower(contentType), "charset=gbk") ||
			strings.Contains(strings.ToLower(contentType), "charset=gb2312") {
			if decoded, err := hrd.detector.decodeGBK(body); err == nil {
				return []byte(decoded), nil
			}
		} else if strings.Contains(strings.ToLower(contentType), "charset=gb18030") {
			if decoded, err := hrd.detector.decodeGB18030(body); err == nil {
				return []byte(decoded), nil
			}
		}
	}

	// 自动检测并解码
	decoded, err := hrd.detector.DetectAndDecode(body)
	if err != nil {
		return body, nil // 返回原始数据
	}

	return []byte(decoded), nil
}

// JSONDecoder JSON解码器
type JSONDecoder struct {
	decoder *HTTPResponseDecoder
}

// NewJSONDecoder 创建JSON解码器
func NewJSONDecoder() *JSONDecoder {
	return &JSONDecoder{
		decoder: NewHTTPResponseDecoder(),
	}
}

// DecodeJSONResponse 解码JSON响应
func (jd *JSONDecoder) DecodeJSONResponse(resp *http.Response, v interface{}) error {
	decodedBody, err := jd.decoder.DecodeResponse(resp)
	if err != nil {
		return fmt.Errorf("解码响应失败: %w", err)
	}

	if err := json.Unmarshal(decodedBody, v); err != nil {
		return fmt.Errorf("JSON解析失败: %w", err)
	}

	return nil
}

// FixChineseEncoding 修复中文编码问题
func FixChineseEncoding(text string) string {
	detector := NewCharsetDetector()
	
	// 如果已经是有效的UTF-8，直接返回
	if utf8.ValidString(text) {
		return text
	}

	// 尝试解码
	if decoded, err := detector.DetectAndDecode([]byte(text)); err == nil {
		return decoded
	}

	return text
}

// EnsureUTF8 确保字符串是有效的UTF-8
func EnsureUTF8(text string) string {
	if utf8.ValidString(text) {
		return text
	}

	// 移除无效的UTF-8字符
	return strings.ToValidUTF8(text, "�")
}
