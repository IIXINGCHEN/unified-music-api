#!/bin/bash

# GitHub Actions 工作流验证脚本
# 用于验证工作流配置的正确性

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必需工具
check_dependencies() {
    log_info "检查必需工具..."
    
    local missing_tools=()
    
    # 检查 yq (YAML 处理工具)
    if ! command -v yq &> /dev/null; then
        missing_tools+=("yq")
    fi
    
    # 检查 jq (JSON 处理工具)
    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
    fi
    
    # 检查 yamllint
    if ! command -v yamllint &> /dev/null; then
        missing_tools+=("yamllint")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "缺少必需工具: ${missing_tools[*]}"
        log_info "请安装缺少的工具:"
        for tool in "${missing_tools[@]}"; do
            case $tool in
                "yq")
                    echo "  - yq: https://github.com/mikefarah/yq#install"
                    ;;
                "jq")
                    echo "  - jq: https://stedolan.github.io/jq/download/"
                    ;;
                "yamllint")
                    echo "  - yamllint: pip install yamllint"
                    ;;
            esac
        done
        return 1
    fi
    
    log_success "所有必需工具已安装"
}

# 验证 YAML 语法
validate_yaml_syntax() {
    log_info "验证 YAML 语法..."
    
    local workflow_dir=".github/workflows"
    local errors=0
    
    if [ ! -d "$workflow_dir" ]; then
        log_error "工作流目录不存在: $workflow_dir"
        return 1
    fi
    
    for file in "$workflow_dir"/*.yml "$workflow_dir"/*.yaml; do
        if [ -f "$file" ]; then
            log_info "检查文件: $(basename "$file")"
            
            # 使用 yamllint 检查语法
            if yamllint "$file" 2>/dev/null; then
                log_success "✓ $(basename "$file") 语法正确"
            else
                log_error "✗ $(basename "$file") 语法错误"
                yamllint "$file"
                ((errors++))
            fi
        fi
    done
    
    if [ $errors -eq 0 ]; then
        log_success "所有工作流文件语法正确"
        return 0
    else
        log_error "发现 $errors 个语法错误"
        return 1
    fi
}

# 验证工作流结构
validate_workflow_structure() {
    log_info "验证工作流结构..."
    
    local workflow_dir=".github/workflows"
    local errors=0
    
    # 必需的工作流文件
    local required_workflows=("ci.yml" "release.yml" "deploy.yml" "quality.yml")
    
    for workflow in "${required_workflows[@]}"; do
        local file="$workflow_dir/$workflow"
        if [ ! -f "$file" ]; then
            log_error "缺少必需的工作流文件: $workflow"
            ((errors++))
            continue
        fi
        
        log_info "验证工作流: $workflow"
        
        # 检查必需字段
        if ! yq eval '.name' "$file" &>/dev/null; then
            log_error "$workflow: 缺少 'name' 字段"
            ((errors++))
        fi
        
        if ! yq eval '.on' "$file" &>/dev/null; then
            log_error "$workflow: 缺少 'on' 字段"
            ((errors++))
        fi
        
        if ! yq eval '.jobs' "$file" &>/dev/null; then
            log_error "$workflow: 缺少 'jobs' 字段"
            ((errors++))
        fi
        
        # 检查作业结构
        local jobs=$(yq eval '.jobs | keys' "$file" 2>/dev/null | grep -v "^null$" || echo "")
        if [ -z "$jobs" ]; then
            log_error "$workflow: 没有定义任何作业"
            ((errors++))
        else
            log_success "✓ $workflow 结构正确"
        fi
    done
    
    if [ $errors -eq 0 ]; then
        log_success "所有工作流结构正确"
        return 0
    else
        log_error "发现 $errors 个结构错误"
        return 1
    fi
}

# 验证环境变量和密钥
validate_secrets_and_env() {
    log_info "验证环境变量和密钥引用..."
    
    local workflow_dir=".github/workflows"
    local warnings=0
    
    # 常见的密钥模式
    local secret_patterns=(
        "secrets\\.GITHUB_TOKEN"
        "secrets\\.[A-Z_]+"
    )
    
    for file in "$workflow_dir"/*.yml; do
        if [ -f "$file" ]; then
            log_info "检查密钥引用: $(basename "$file")"
            
            # 检查密钥引用
            for pattern in "${secret_patterns[@]}"; do
                local matches=$(grep -oE "$pattern" "$file" 2>/dev/null || true)
                if [ -n "$matches" ]; then
                    echo "$matches" | while read -r match; do
                        if [[ "$match" != "secrets.GITHUB_TOKEN" ]]; then
                            log_warning "发现自定义密钥引用: $match (请确保在 GitHub 中配置)"
                            ((warnings++))
                        fi
                    done
                fi
            done
        fi
    done
    
    if [ $warnings -gt 0 ]; then
        log_warning "发现 $warnings 个密钥引用警告"
    else
        log_success "密钥引用检查完成"
    fi
}

# 验证 Docker 配置
validate_docker_config() {
    log_info "验证 Docker 配置..."
    
    local dockerfile="Dockerfile"
    local errors=0
    
    if [ ! -f "$dockerfile" ]; then
        log_error "Dockerfile 不存在"
        return 1
    fi
    
    # 检查 Dockerfile 基本结构
    if ! grep -q "^FROM" "$dockerfile"; then
        log_error "Dockerfile 缺少 FROM 指令"
        ((errors++))
    fi
    
    if ! grep -q "^WORKDIR" "$dockerfile"; then
        log_warning "Dockerfile 建议使用 WORKDIR 指令"
    fi
    
    if ! grep -q "^EXPOSE" "$dockerfile"; then
        log_warning "Dockerfile 建议使用 EXPOSE 指令"
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "Docker 配置验证通过"
        return 0
    else
        log_error "Docker 配置验证失败"
        return 1
    fi
}

# 验证 golangci-lint 配置
validate_golangci_config() {
    log_info "验证 golangci-lint 配置..."
    
    local config_file=".golangci.yml"
    
    if [ ! -f "$config_file" ]; then
        log_error "golangci-lint 配置文件不存在: $config_file"
        return 1
    fi
    
    # 检查配置文件语法
    if ! yamllint "$config_file" &>/dev/null; then
        log_error "golangci-lint 配置文件语法错误"
        yamllint "$config_file"
        return 1
    fi
    
    # 检查必需配置
    if ! yq eval '.linters.enable' "$config_file" &>/dev/null; then
        log_error "golangci-lint 配置缺少启用的检查器"
        return 1
    fi
    
    local enabled_linters=$(yq eval '.linters.enable | length' "$config_file" 2>/dev/null || echo "0")
    if [ "$enabled_linters" -lt 10 ]; then
        log_warning "启用的检查器数量较少: $enabled_linters"
    else
        log_success "启用了 $enabled_linters 个检查器"
    fi
    
    log_success "golangci-lint 配置验证通过"
}

# 生成验证报告
generate_report() {
    log_info "生成验证报告..."
    
    local report_file="workflow-validation-report.md"
    
    cat > "$report_file" << EOF
# GitHub Actions 工作流验证报告

**生成时间**: $(date)
**验证脚本**: $0

## 验证结果

### ✅ 通过的检查
- YAML 语法验证
- 工作流结构验证
- Docker 配置验证
- golangci-lint 配置验证

### ⚠️ 警告
- 自定义密钥引用 (请确保在 GitHub 中正确配置)

### 📋 工作流文件清单
EOF
    
    local workflow_dir=".github/workflows"
    for file in "$workflow_dir"/*.yml; do
        if [ -f "$file" ]; then
            local name=$(yq eval '.name' "$file" 2>/dev/null || echo "未命名")
            echo "- $(basename "$file"): $name" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << EOF

### 🔧 配置文件
- .golangci.yml: golangci-lint 配置
- Dockerfile: Docker 构建配置

### 📝 建议
1. 定期更新工作流中使用的 Action 版本
2. 确保所有自定义密钥在 GitHub Repository Settings 中正确配置
3. 定期检查依赖项的安全更新
4. 监控工作流执行时间，优化性能

---
**验证完成** ✅
EOF
    
    log_success "验证报告已生成: $report_file"
}

# 主函数
main() {
    echo "🔍 GitHub Actions 工作流验证工具"
    echo "=================================="
    echo
    
    local exit_code=0
    
    # 执行所有验证
    check_dependencies || exit_code=1
    validate_yaml_syntax || exit_code=1
    validate_workflow_structure || exit_code=1
    validate_secrets_and_env
    validate_docker_config || exit_code=1
    validate_golangci_config || exit_code=1
    
    echo
    echo "=================================="
    
    if [ $exit_code -eq 0 ]; then
        log_success "🎉 所有验证通过！工作流配置正确。"
        generate_report
    else
        log_error "❌ 验证失败，请修复上述错误后重试。"
    fi
    
    exit $exit_code
}

# 运行主函数
main "$@"
